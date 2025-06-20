from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, AdminUser, MapList, MapApply, MapHistory, Advice
import os
import uuid
from imgbb_storage import upload_to_imgbb

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        session_db = SessionLocal()
        user = session_db.query(AdminUser).filter_by(username=username, password=password).first()
        session_db.close()
        if user:
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return redirect(url_for('admin.admin_home'))
        else:
            flash('用户名或密码错误', 'error')
    return render_template('admin_login.html')

@admin_bp.route('/')
def admin_home():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin.login'))
    # 分页与搜索（地图）
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    session_db = SessionLocal()
    query = session_db.query(MapList)
    if search:
        query = query.filter(MapList.name.like(f"%{search}%"))
    total_maps = query.count()
    per_page = 20
    maps = query.offset((page-1)*per_page).limit(per_page).all()
    total_pages = (total_maps + per_page - 1) // per_page
    # 申请信息分页与筛选
    apply_page = request.args.get('apply_page', 1, type=int)
    apply_status = request.args.get('apply_status', '', type=str)
    apply_query = session_db.query(MapApply)
    if apply_status:
        apply_query = apply_query.filter(MapApply.status == apply_status)
    total_apply = apply_query.count()
    apply_per_page = 20
    applies = apply_query.order_by(MapApply.create_time.desc()).offset((apply_page-1)*apply_per_page).limit(apply_per_page).all()
    total_apply_pages = (total_apply + apply_per_page - 1) // apply_per_page
    session_db.close()
    return render_template('admin_home.html', username=session.get('admin_username'), maps=maps, current_page=page, total_pages=total_pages, search=search,
                           applies=applies, apply_page=apply_page, total_apply_pages=total_apply_pages, apply_status=apply_status)

@admin_bp.route('/map/delete/<int:map_id>', methods=['POST'])
def admin_map_delete(map_id):
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'msg': '未登录'}), 401
    session_db = SessionLocal()
    try:
        map_obj = session_db.query(MapList).filter(MapList.id == map_id).first()
        if not map_obj:
            return jsonify({'success': False, 'msg': '地图不存在'})
        # 删除图片文件（如有）
        image_path_val = getattr(map_obj, 'image', None)
        if image_path_val:
            img_path = os.path.join(os.path.dirname(__file__), 'static', image_path_val) if not os.path.isabs(image_path_val) else image_path_val
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except Exception:
                    pass
        session_db.delete(map_obj)
        session_db.commit()
        return jsonify({'success': True})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/map/edit/<int:map_id>', methods=['POST'])
def admin_map_edit(map_id):
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'msg': '未登录'}), 401
    session_db = SessionLocal()
    try:
        map_obj = session_db.query(MapList).filter(MapList.id == map_id).first()
        if not map_obj:
            return jsonify({'success': False, 'msg': '地图不存在'})
        name = request.form.get('mapName')
        region = request.form.get('mapRegion')
        mapper = request.form.get('mapAuthor')
        level = request.form.get('mapDifficulty')
        image_file = request.files.get('mapImage')
        setattr(map_obj, 'name', name or "")
        setattr(map_obj, 'region', region or "")
        setattr(map_obj, 'mapper', mapper or "")
        setattr(map_obj, 'level', level or "")
        # 保存新图片（如有）
        if image_file and image_file.filename:
            ext = os.path.splitext(image_file.filename)[1]
            image_filename = f"uploads/map_{uuid.uuid4().hex}{ext}"
            static_dir = os.path.join(os.path.dirname(__file__), 'static')
            image_path = os.path.join(static_dir, image_filename)
            image_file.save(image_path)
            setattr(map_obj, 'image', image_filename)
        session_db.commit()
        # 写入历史表
        history = MapHistory(
            map_id=map_obj.id,
            name=map_obj.name,
            region=map_obj.region,
            mapper=map_obj.mapper,
            level=map_obj.level,
            image=map_obj.image,
            note='管理员直接修改',
            action='edit',
            operator=session.get('admin_username', '管理员')
        )
        session_db.add(history)
        session_db.commit()
        return jsonify({'success': True})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/apply/review/<int:apply_id>', methods=['POST'])
def admin_apply_review(apply_id):
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'msg': '未登录'}), 401
    data = request.get_json()
    action = data.get('action')
    session_db = SessionLocal()
    try:
        apply = session_db.query(MapApply).filter(MapApply.id == apply_id).first()
        if not apply:
            return jsonify({'success': False, 'msg': '申请不存在'})
        apply_type = getattr(apply, 'type', None)
        apply_map_id = getattr(apply, 'map_id', None)
        apply_status = getattr(apply, 'status', None)
        apply_image = getattr(apply, 'image', None)
        if action == '通过':
            # 添加申请：插入新地图
            if apply_type == 'add':
                new_map = MapList(
                    name=apply.name,
                    region=apply.region,
                    mapper=apply.mapper,
                    level=apply.level,
                    image=apply_image
                )
                session_db.add(new_map)
                session_db.commit()
                # 写入历史表
                history = MapHistory(
                    map_id=new_map.id,
                    name=new_map.name,
                    region=new_map.region,
                    mapper=new_map.mapper,
                    level=new_map.level,
                    image=new_map.image,
                    note=apply.note,
                    action='add',
                    operator=session.get('admin_username', '管理员'),
                    origin_apply_id=apply.id
                )
                session_db.add(history)
            # 修改申请：更新原地图
            elif apply_type == 'edit' and apply_map_id:
                map_obj = session_db.query(MapList).filter(MapList.id == apply_map_id).first()
                if map_obj:
                    map_obj.name = apply.name
                    map_obj.region = apply.region
                    map_obj.mapper = apply.mapper
                    map_obj.level = apply.level
                    if apply_image:
                        map_obj.image = apply_image
                    # 写入历史表
                    history = MapHistory(
                        map_id=map_obj.id,
                        name=apply.name,
                        region=apply.region,
                        mapper=apply.mapper,
                        level=apply.level,
                        image=apply_image,
                        note=apply.note,
                        action='edit',
                        operator=session.get('admin_username', '管理员'),
                        origin_apply_id=apply.id
                    )
                    session_db.add(history)
            setattr(apply, 'status', '通过')
        elif action == '拒绝':
            setattr(apply, 'status', '拒绝')
        else:
            return jsonify({'success': False, 'msg': '无效操作'})
        session_db.commit()
        # 审核后直接删除申请记录
        session_db.delete(apply)
        session_db.commit()
        return jsonify({'success': True})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/map/history/<int:map_id>')
def admin_map_history(map_id):
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'msg': '未登录'}), 401
    session_db = SessionLocal()
    try:
        history = session_db.query(MapHistory).filter(MapHistory.map_id == map_id).order_by(MapHistory.operate_time.desc()).all()
        result = []
        for h in history:
            result.append({
                'operate_time': h.operate_time.strftime('%Y-%m-%d %H:%M') if h.operate_time is not None else '',
                'operator': h.operator,
                'action': h.action,
                'name': h.name,
                'mapper': h.mapper,
                'region': h.region,
                'level': h.level,
                'note': h.note
            })
        return jsonify({'success': True, 'history': result})
    except Exception as e:
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/map/add', methods=['POST'])
def admin_map_add():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin.login'))
    name = request.form.get('name')
    region = request.form.get('region')
    mapper = request.form.get('mapper')
    level = request.form.get('level')
    note = request.form.get('note')
    image_file = request.files.get('image')
    session_db = SessionLocal()
    # 检查地图名称+大区是否重复
    exists = session_db.query(MapList).filter(MapList.name == name, MapList.region == region).first()
    if exists:
        session_db.close()
        return render_template('admin_home.html', add_map_msg='该地图已存在', **_get_admin_home_context())
    image_url = None
    if image_file and image_file.filename:
        image_url = upload_to_imgbb(image_file)
    new_map = MapList(name=name, region=region, mapper=mapper, level=level, image=image_url)
    session_db.add(new_map)
    session_db.commit()
    # 写入历史表
    history = MapHistory(
        map_id=new_map.id,
        name=new_map.name,
        region=new_map.region,
        mapper=new_map.mapper,
        level=new_map.level,
        image=new_map.image,
        note=note,
        action='add',
        operator=session.get('admin_username', '管理员')
    )
    session_db.add(history)
    session_db.commit()
    session_db.close()
    return redirect(url_for('admin.admin_home'))

@admin_bp.route('/advice/list')
def admin_advice_list():
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'msg': '未登录'})
    session_db = SessionLocal()
    advices = session_db.query(Advice).order_by(Advice.id.desc()).all()
    session_db.close()
    return jsonify({
        'success': True,
        'list': [
            {
                'content': a.content,
                'create_time': a.create_time.strftime('%Y-%m-%d %H:%M:%S') if getattr(a, 'create_time', None) is not None else ''
            } for a in advices
        ]
    })

def _get_admin_home_context():
    # 复用admin_home的上下文参数
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    session_db = SessionLocal()
    query = session_db.query(MapList)
    if search:
        query = query.filter(MapList.name.like(f"%{search}%"))
    total_maps = query.count()
    per_page = 20
    maps = query.offset((page-1)*per_page).limit(per_page).all()
    total_pages = (total_maps + per_page - 1) // per_page
    # 申请信息分页与筛选
    apply_page = request.args.get('apply_page', 1, type=int)
    apply_status = request.args.get('apply_status', '', type=str)
    apply_query = session_db.query(MapApply)
    if apply_status:
        apply_query = apply_query.filter(MapApply.status == apply_status)
    total_apply = apply_query.count()
    apply_per_page = 20
    applies = apply_query.order_by(MapApply.create_time.desc()).offset((apply_page-1)*apply_per_page).limit(apply_per_page).all()
    total_apply_pages = (total_apply + apply_per_page - 1) // apply_per_page
    session_db.close()
    return dict(username=session.get('admin_username'), maps=maps, current_page=page, total_pages=total_pages, search=search,
                applies=applies, apply_page=apply_page, total_apply_pages=total_apply_pages, apply_status=apply_status) 