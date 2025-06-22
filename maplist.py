from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from models import SessionLocal, MapList, MapApply
from config import config
from auth import login_required
from imgbb_storage import init_imgbb_storage, upload_to_imgbb
from sqlalchemy import or_

# =====================
# 配置与常量
# =====================
# 获取全局配置
app_config = config['default']
PER_PAGE = app_config.MAPS_PER_PAGE
IMGBB_API_KEY = getattr(app_config, 'IMGBB_API_KEY', None)
if IMGBB_API_KEY:
    init_imgbb_storage(IMGBB_API_KEY)

# 地图类型常量
MAP_TYPES = ['连跳', '攀岩', '连跳/攀岩', '长跳', '滑坡', '其它']

# =====================
# Flask 蓝图注册
# =====================
maplist_bp = Blueprint('maplist', __name__)

# =====================
# 分页查询函数
# =====================
def get_paginated_maps(page, per_page=PER_PAGE):
    """分页获取地图列表"""
    session = SessionLocal()
    try:
        total_maps = session.query(MapList).count()
        maps = session.query(MapList).offset((page-1)*per_page).limit(per_page).all()
        return maps, total_maps
    finally:
        session.close()

# =====================
# 路由：主页面（带分页）
# =====================
@maplist_bp.route('/mainpage', methods=['GET'])
@login_required
def mainpage():
    """主页面，展示地图列表，支持分页和筛选"""
    page = request.args.get('page', 1, type=int)
    region = request.args.get('region', '').strip()
    level = request.args.get('level', '').strip()
    map_type = request.args.get('type', '').strip()
    search = request.args.get('search', '').strip()

    session = SessionLocal()
    try:
        query = session.query(MapList)
        if region:
            query = query.filter(MapList.region == region)
        if level:
            query = query.filter(MapList.level == level)
        if map_type:
            query = query.filter(MapList.type == map_type)
        if search:
            # 使用 .contains() 方法进行子字符串查询，SQLAlchemy会自动处理转义
            # 同时搜索地图名称、作者
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    MapList.name.like(search_term),
                    MapList.mapper.like(search_term)
                )
            )
        
        total_maps = query.count()
        maps = query.offset((page - 1) * PER_PAGE).limit(PER_PAGE).all()
        total_pages = (total_maps + PER_PAGE - 1) // PER_PAGE

        template_context = {
            'maps': maps,
            'current_page': page,
            'total_pages': total_pages,
            'map_types': MAP_TYPES,
            'total_maps': total_maps
        }

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            results_html = render_template('_filter_results_partial.html', **template_context)
            maps_html = render_template('_map_list_partial.html', **template_context)
            return jsonify(results_html=results_html, maps_html=maps_html)
        else:
            return render_template('mainpage.html', **template_context)
    finally:
        session.close()

# =====================
# 路由：添加地图（POST）
# =====================
@maplist_bp.route('/map/add', methods=['POST'])
@login_required
def map_add():
    """处理添加地图表单，写入 map_apply 申请表"""
    name = request.form.get('name')
    region = request.form.get('region')
    mapper = request.form.get('mapper')
    level = request.form.get('level')
    map_type = request.form.get('type', '连跳')
    note = request.form.get('note')
    image_file = request.files.get('image')
    image_url = None
    session = SessionLocal()
    try:
        exist = session.query(MapList).filter_by(name=name, region=region, mapper=mapper).first()
        if exist:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'msg': '该地图（名称+大区+作者）已存在，不能重复申请！'})
            flash('该地图（名称+大区+作者）已存在，不能重复申请！')
            return redirect(url_for('maplist.mainpage'))
        if image_file and image_file.filename:
            image_url = upload_to_imgbb(image_file)
        new_apply = MapApply(
            type='add',
            map_id=None,
            name=name,
            region=region,
            mapper=mapper,
            level=level,
            maptype=map_type,
            image=image_url or "",
            note=note,
            status='待审核'
        )
        session.add(new_apply)
        session.commit()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': True})
        flash('申请已提交，等待管理员审核！')
    except Exception as e:
        session.rollback()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'msg': '申请提交失败：' + str(e)})
        flash('申请提交失败：' + str(e))
    finally:
        session.close()
    return redirect(url_for('maplist.mainpage'))

# =====================
# 路由：网站建议
# =====================
@maplist_bp.route('/advice/add', methods=['POST'])
@login_required
def add_advice():
    """接收网站建议"""
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'success': False, 'msg': '建议内容不能为空'})
    
    # 在实际项目中，您应该将建议存储到数据库
    print(f"收到建议: {content}") 
    return jsonify({'success': True})

# =====================
# 路由：申请添加地图页面（预留）
# =====================
@maplist_bp.route('/map/apply')
@login_required
def map_apply():
    """申请添加地图页面（暂未实现）"""
    return "这里是申请添加地图的页面，后续可完善"
