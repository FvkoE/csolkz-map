from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, User, MapList, MapApply, MapHistory, Advice, UploadApply, MapUpload
from auth import admin_required, roles_required
from storage import upload_image
from sqlalchemy import or_
from datetime import datetime
from sqlalchemy.orm import joinedload

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/login', methods=['GET', 'POST'])
def admin_login():
    """管理员专用登录页面"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('用户名和密码不能为空', 'error')
            return render_template('admin_login.html')
        
        session_db = SessionLocal()
        try:
            # 只查询管理员角色的用户
            user = session_db.query(User).options(joinedload(User.roles)).filter_by(
                username=username,
                is_active=True
            ).first()
            if user and any(role.name in ['admin', 'map_admin', 'demo_admin'] for role in user.roles):
                # 管理员、地图管理员或记录管理员登录成功，设置管理员专用会话
                remember_me = request.form.get('remember_me') == 'on'
                if remember_me:
                    session.permanent = True  # 启用持久化会话
                else:
                    session.permanent = False  # 使用临时会话（浏览器关闭后失效）
                session['admin_logged_in'] = True
                session['admin_username'] = user.username
                session['admin_user_id'] = user.id
                session['admin_user_role'] = ','.join([role.name for role in user.roles])
                _ = user.roles  # 触发加载
                roles = [role.name for role in user.roles]
                session['roles'] = roles
                flash('管理员登录成功！', 'success')
                # 登录后根据角色跳转
                if 'admin' in roles or 'map_admin' in roles:
                    return redirect(url_for('admin.admin_home'))
                elif 'demo_admin' in roles:
                    return redirect(url_for('admin.record_review'))
                else:
                    flash('没有可访问的后台页面', 'error')
                    return redirect(url_for('admin.admin_login'))
            else:
                flash('用户名或密码错误，或该用户没有管理权限', 'error')
        finally:
            session_db.close()
    
    return render_template('admin_login.html')

@admin_bp.route('/logout')
def admin_logout():
    """管理员登出"""
    # 只清除管理员相关的会话信息，保留普通用户会话
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    session.pop('admin_user_id', None)
    session.pop('admin_user_role', None)
    
    # 设置响应头，防止浏览器缓存
    response = redirect(url_for('admin.admin_login'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    flash('已退出管理员登录', 'info')
    return response

@admin_bp.route('/')
@roles_required('map_admin')
def admin_home():
    # 获取用户名，优先使用管理员会话中的用户名
    username = session.get('admin_username') or session.get('username', '管理员')
    
    # 分页与搜索（地图）
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    session_db = SessionLocal()
    query = session_db.query(MapList)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MapList.name.like(search_term),
                MapList.mapper.like(search_term)
            )
        )
    total_maps = query.count()
    per_page = 20
    maps = query.offset((page-1)*per_page).limit(per_page).all()
    total_pages = (total_maps + per_page - 1) // per_page
    # 申请信息分页与筛选
    apply_page = request.args.get('apply_page', 1, type=int)
    apply_status = request.args.get('apply_status', '待审核')
    apply_query = session_db.query(MapApply)
    if apply_status:
        if apply_status == '同意':
            apply_query = apply_query.filter(MapApply.status == '通过')
        else:
            apply_query = apply_query.filter(MapApply.status == apply_status)
    total_apply = apply_query.count()
    apply_per_page = 20
    applies = apply_query.order_by(MapApply.create_time.desc()).offset((apply_page-1)*apply_per_page).limit(apply_per_page).all()
    total_apply_pages = (total_apply + apply_per_page - 1) // apply_per_page
    session_db.close()
    return render_template('admin_home.html', username=username, maps=maps, current_page=page, total_pages=total_pages, search=search,
                           applies=applies, apply_page=apply_page, total_apply_pages=total_apply_pages, apply_status=apply_status,
                           all_apply_statuses=['待审核', '同意', '拒绝'])

@admin_bp.route('/map/delete/<int:map_id>', methods=['POST'])
@admin_required
def admin_map_delete(map_id):
    session_db = SessionLocal()
    try:
        # 首先，删除与该地图关联的所有历史记录
        session_db.query(MapHistory).filter(MapHistory.map_id == map_id).delete(synchronize_session=False)

        # 其次，删除与该地图关联的所有申请记录
        session_db.query(MapApply).filter(MapApply.map_id == map_id).delete(synchronize_session=False)

        # 然后，查找要删除的地图对象
        map_obj = session_db.query(MapList).filter(MapList.id == map_id).first()
        
        if not map_obj:
            # 如果没有地图，但历史记录可能已被删除，也算部分成功，回滚以撤销删除
            session_db.rollback() 
            return jsonify({'success': False, 'msg': '地图不存在'})
        
        # 最后，删除地图对象
        session_db.delete(map_obj)
        session_db.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/map/edit/<int:map_id>', methods=['POST'])
@admin_required
def admin_map_edit(map_id):
    session_db = SessionLocal()
    try:
        map_obj = session_db.query(MapList).filter(MapList.id == map_id).first()
        if not map_obj:
            return jsonify({'success': False, 'msg': '地图不存在'})
        name = request.form.get('mapName')
        region = request.form.get('mapRegion')
        mapper = request.form.get('mapAuthor')
        level = request.form.get('mapDifficulty')
        map_type = request.form.get('mapType', '连跳')
        image_file = request.files.get('mapImage')
        setattr(map_obj, 'name', name or "")
        setattr(map_obj, 'region', region or "")
        setattr(map_obj, 'mapper', mapper or "")
        setattr(map_obj, 'level', level or "")
        setattr(map_obj, 'type', map_type)
        # 保存新图片（如有）
        if image_file and image_file.filename:
            try:
                print(f"管理员开始编辑图片: {image_file.filename}")
                image_url = upload_image(image_file)
                if image_url:
                    setattr(map_obj, 'image', image_url)
                    print(f"管理员图片编辑成功: {image_url}")
                else:
                    print("管理员图片编辑失败")
            except Exception as e:
                print(f"管理员图片编辑异常: {e}")
        session_db.commit()
        # 写入历史表
        history = MapHistory(
            map_id=map_obj.id,
            name=map_obj.name,
            region=map_obj.region,
            mapper=map_obj.mapper,
            level=map_obj.level,
            type=map_obj.type,
            image=map_obj.image,
            note='管理员直接修改',
            action='edit',
            operator=session.get('admin_username') or session.get('username', '管理员')
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
@admin_required
def admin_apply_review(apply_id):
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
                    type=getattr(apply, 'maptype', '连跳'),
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
                    type=new_map.type,
                    image=new_map.image,
                    note=apply.note,
                    action='add',
                    operator=session.get('admin_username') or session.get('username', '管理员'),
                    origin_apply_id=apply.id
                )
                session_db.add(history)
            # 修改申请：更新原地图
            elif apply_type == 'edit' and apply_map_id:
                map_obj = session_db.query(MapList).filter(MapList.id == apply_map_id).first()
                if map_obj:
                    setattr(map_obj, 'name', apply.name)
                    setattr(map_obj, 'region', apply.region)
                    setattr(map_obj, 'mapper', apply.mapper)
                    setattr(map_obj, 'level', apply.level)
                    setattr(map_obj, 'type', getattr(apply, 'maptype', '连跳'))
                    if apply_image:
                        setattr(map_obj, 'image', apply_image)
                    # 写入历史表
                    history = MapHistory(
                        map_id=map_obj.id,
                        name=apply.name,
                        region=apply.region,
                        mapper=apply.mapper,
                        level=apply.level,
                        type=map_obj.type,
                        image=apply_image,
                        note=apply.note,
                        action='edit',
                        operator=session.get('admin_username') or session.get('username', '管理员'),
                        origin_apply_id=apply.id
                    )
                    session_db.add(history)
            setattr(apply, 'status', '通过')
        elif action == '拒绝':
            setattr(apply, 'status', '拒绝')
        else:
            return jsonify({'success': False, 'msg': '无效操作'})
        
        session_db.commit()

        return jsonify({'success': True})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

@admin_bp.route('/map/history/<int:map_id>')
@admin_required
def admin_map_history(map_id):
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
@admin_required
def admin_map_add():
    name = request.form.get('name')
    region = request.form.get('region')
    mapper = request.form.get('mapper')
    level = request.form.get('level')
    map_type = request.form.get('type', '连跳')
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
        try:
            print(f"管理员开始上传图片: {image_file.filename}")
            image_url = upload_image(image_file)
            if not image_url:
                print("管理员图片上传失败")
                image_url = None
            else:
                print(f"管理员图片上传成功: {image_url}")
        except Exception as e:
            print(f"管理员图片上传异常: {e}")
            image_url = None
    
    try:
        # 1. 直接添加到maplist表（无需审核）
        new_map = MapList(name=name, region=region, mapper=mapper, level=level, type=map_type, image=image_url)
        session_db.add(new_map)
        session_db.commit()
        
        # 2. 在map_apply表中创建一条已处理的记录用于历史追踪
        admin_apply = MapApply(
            type='add',
            map_id=new_map.id,
            name=name,
            region=region,
            mapper=mapper,
            level=level,
            maptype=map_type,
            image=image_url,
            note=note or '管理员直接添加',
            status='已处理'  # 直接设为已处理，不会出现在申请列表中
        )
        session_db.add(admin_apply)
        session_db.commit()
        
        # 3. 写入历史表
        history = MapHistory(
            map_id=new_map.id,
            name=new_map.name,
            region=new_map.region,
            mapper=new_map.mapper,
            level=new_map.level,
            type=new_map.type,
            image=new_map.image,
            note=note or '管理员直接添加',
            action='add',
            operator=session.get('admin_username') or session.get('username', '管理员'),
            origin_apply_id=admin_apply.id  # 关联到刚创建的申请记录
        )
        session_db.add(history)
        session_db.commit()
        
        print(f"管理员成功添加地图: {name} (ID: {new_map.id})")
        
    except Exception as e:
        session_db.rollback()
        print(f"管理员添加地图失败: {e}")
        session_db.close()
        return render_template('admin_home.html', add_map_msg=f'添加失败：{str(e)}', **_get_admin_home_context())
    finally:
        session_db.close()
    
    return redirect(url_for('admin.admin_home'))

@admin_bp.route('/advice/list')
@admin_required
def admin_advice_list():
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

@admin_bp.route('/check_admin_login')
def check_admin_login():
    """检查管理员登录状态（AJAX接口）"""
    if session.get('admin_logged_in'):
        return jsonify({
            'admin_logged_in': True, 
            'admin_username': session.get('admin_username'),
            'admin_role': session.get('admin_user_role')
        })
    else:
        return jsonify({'admin_logged_in': False})

@admin_bp.route('/record/review')
@roles_required('demo_admin')
def record_review():
    """记录审核页面，显示upload_apply所有记录，支持状态筛选"""
    username = session.get('admin_username') or session.get('username', '管理员')
    status = request.args.get('status', 'pending')  # 默认只显示待审核
    session_db = SessionLocal()
    # 查询upload_apply记录，按时间倒序，支持状态筛选
    query = session_db.query(
        UploadApply,
        MapList.name.label('map_name'),
        MapList.region.label('map_region'),
        MapList.image.label('map_image'),
        User.nickname.label('user_nickname'),
        User.username.label('user_username')
    ).join(MapList, UploadApply.maplist_id == MapList.id) \
     .join(User, UploadApply.user_id == User.id)
    if status:
        query = query.filter(UploadApply.status == status)
    records = query.order_by(UploadApply.upload_time.desc()).all()
    session_db.close()
    # 组装数据，便于模板渲染
    record_list = []
    for r in records:
        u, map_name, map_region, map_image, user_nickname, user_username = r
        record_list.append({
            'id': u.id,
            'map_name': map_name,
            'map_region': map_region,
            'map_image': map_image,
            'user_nickname': user_nickname or user_username,
            'finish_time': u.finish_time,
            'user_rank': u.user_rank,
            'upload_time': u.upload_time,
            'score': u.score,
            'first_clear_score': u.first_clear_score,
            'mode': u.mode,
            'is_first_clear': u.is_first_clear,
            'video_url': u.video_url,
            'status': u.status,
            'cp': u.cp,
            'tp': u.tp,
            'resonable': u.resonable,
            'SUGGEST_LEVEL': u.SUGGEST_LEVEL,
            'reviewer_id': u.reviewer_id,
            'review_time': u.review_time,
            'reject_reason': u.reject_reason
        })
    return render_template('record_review.html', username=username, records=record_list, all_statuses=['pending','approve','refuse'], current_status=status)

@admin_bp.route('/upload_apply/review/<int:apply_id>', methods=['POST'])
@admin_required
def review_upload_apply(apply_id):
    data = request.get_json()
    action = data.get('action')
    reject_reason = data.get('reject_reason', '')
    session_db = SessionLocal()
    try:
        apply = session_db.query(UploadApply).filter(UploadApply.id == apply_id).first()
        if not apply:
            return jsonify({'success': False, 'msg': '记录不存在'})
        if action == 'approve':
            # 1. 查询该地图所有已通过记录
            approved_records = session_db.query(MapUpload).filter(
                MapUpload.maplist_id == apply.maplist_id,
                MapUpload.status == 'approve'
            ).all()
            # 2. 构造临时列表，加入当前审核通过的记录
            temp_list = [
                {
                    'finish_time': r.finish_time,
                    'upload_time': r.upload_time,
                    'user_id': r.user_id,
                    'id': r.id  # 用于唯一标识
                } for r in approved_records
            ]
            # 当前审核通过的记录（未入库，临时加入）
            temp_list.append({
                'finish_time': apply.finish_time,
                'upload_time': apply.upload_time,
                'user_id': apply.user_id,
                'id': -1  # 用-1标识
            })
            # 3. 排序
            temp_list_sorted = sorted(temp_list, key=lambda r: (r['finish_time'], r['upload_time']))
            # 4. 计算排名
            for idx, r in enumerate(temp_list_sorted):
                if r['id'] == -1:
                    user_rank = idx + 1
                    break
            # 5. 查找地图难度level
            map_obj = session_db.query(MapList).filter(MapList.id == apply.maplist_id).first()
            level = map_obj.level if map_obj else '入门'
            # 6. 计算积分
            from score_calc_simple import calc_score_simple, get_k
            t1 = temp_list_sorted[0]['finish_time']
            k = get_k(level)
            score = round(calc_score_simple(apply.finish_time, t1, k, user_rank))
            # 7. 写入map_upload表
            new_upload = MapUpload(
                maplist_id=apply.maplist_id,
                user_id=apply.user_id,
                finish_time=apply.finish_time,
                user_rank=user_rank,  # 自动计算的排名
                upload_time=apply.upload_time,
                score=score,  # 用最新积分
                first_clear_score=apply.first_clear_score,
                mode=apply.mode,
                is_first_clear=apply.is_first_clear,
                video_url=apply.video_url,
                status='approve',
                cp=apply.cp,
                tp=apply.tp,
                resonable=apply.resonable,
                SUGGEST_LEVEL=apply.SUGGEST_LEVEL
            )
            session_db.add(new_upload)
            apply.status = 'approve'
            apply.review_time = datetime.now()
            apply.reviewer_id = session.get('admin_user_id')
            session_db.commit()

            # 新增：批量更新该地图该模式所有已通过记录的排名和积分（每用户只保留最快且最早上传的记录）
            all_records = session_db.query(MapUpload).filter(
                MapUpload.maplist_id == apply.maplist_id,
                MapUpload.mode == apply.mode,  # 按模式区分
                MapUpload.status == 'approve'
            ).order_by(MapUpload.finish_time, MapUpload.upload_time).all()
            # 只保留每个用户最快且最早上传的那一条
            best_records = {}
            for rec in all_records:
                key = rec.user_id
                if key not in best_records:
                    best_records[key] = rec
            sorted_records = sorted(best_records.values(), key=lambda r: (r.finish_time, r.upload_time))
            if sorted_records:
                t1 = sorted_records[0].finish_time
                k = get_k(level)
                for idx, rec in enumerate(sorted_records):
                    rank = idx + 1
                    rec.user_rank = rank
                    rec.score = round(calc_score_simple(rec.finish_time, t1, k, rank))
                session_db.commit()

            # 新增：自动判定WR（World Record）
            # 1. 先将该地图所有记录的 is_wr 字段全部设为 'N'
            session_db.query(MapUpload).filter(
                MapUpload.maplist_id == apply.maplist_id
            ).update({MapUpload.is_wr: 'N'})
            session_db.commit()
            # 2. 查找该地图下最快的裸跳记录
            pro_wr = session_db.query(MapUpload).filter(
                MapUpload.maplist_id == apply.maplist_id,
                MapUpload.mode == 'pro',
                MapUpload.status == 'approve'
            ).order_by(MapUpload.finish_time.asc(), MapUpload.upload_time.asc()).first()
            if pro_wr:
                pro_wr.is_wr = 'Y'
                session_db.commit()
            else:
                # 没有裸跳，找最快的存点
                nub_wr = session_db.query(MapUpload).filter(
                    MapUpload.maplist_id == apply.maplist_id,
                    MapUpload.mode == 'nub',
                    MapUpload.status == 'approve'
                ).order_by(MapUpload.finish_time.asc(), MapUpload.upload_time.asc()).first()
                if nub_wr:
                    nub_wr.is_wr = 'Y'
                    session_db.commit()

            return jsonify({'success': True})
        elif action == 'reject':
            apply.status = 'refuse'
            apply.reject_reason = reject_reason
            apply.review_time = datetime.now()
            apply.reviewer_id = session.get('admin_user_id')
            session_db.commit()
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'msg': '无效操作'})
    except Exception as e:
        session_db.rollback()
        return jsonify({'success': False, 'msg': str(e)})
    finally:
        session_db.close()

def _get_admin_home_context():
    # 复用admin_home的上下文参数
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    session_db = SessionLocal()
    query = session_db.query(MapList)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MapList.name.like(search_term),
                MapList.mapper.like(search_term)
            )
        )
    total_maps = query.count()
    per_page = 20
    maps = query.offset((page-1)*per_page).limit(per_page).all()
    total_pages = (total_maps + per_page - 1) // per_page
    # 申请信息分页与筛选
    apply_page = request.args.get('apply_page', 1, type=int)
    apply_status = request.args.get('apply_status', '待审核')
    apply_query = session_db.query(MapApply)
    if apply_status:
        if apply_status == '同意':
            apply_query = apply_query.filter(MapApply.status == '通过')
        else:
            apply_query = apply_query.filter(MapApply.status == apply_status)
    total_apply = apply_query.count()
    apply_per_page = 20
    applies = apply_query.order_by(MapApply.create_time.desc()).offset((apply_page-1)*apply_per_page).limit(apply_per_page).all()
    total_apply_pages = (total_apply + apply_per_page - 1) // apply_per_page
    session_db.close()
    return dict(username=session.get('admin_username') or session.get('username', '管理员'), maps=maps, current_page=page, total_pages=total_pages, search=search,
                applies=applies, apply_page=apply_page, total_apply_pages=total_apply_pages, apply_status=apply_status) 