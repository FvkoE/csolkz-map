from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from models import SessionLocal, MapList, MapApply
from config import config
from auth import login_required
from storage import init_storage, upload_image, get_storage_method
from sqlalchemy import or_, and_, text

# =====================
# 配置与常量
# =====================
# 获取全局配置
app_config = config['default']
PER_PAGE = app_config.MAPS_PER_PAGE
IMGBB_API_KEY = getattr(app_config, 'IMGBB_API_KEY', None)

# 初始化存储系统
if IMGBB_API_KEY:
    init_storage(IMGBB_API_KEY)
else:
    init_storage()
    print("警告: IMGBB_API_KEY未配置，将使用本地存储")

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
def mainpage():
    """主页面，展示地图列表，支持分页和筛选"""
    page = request.args.get('page', 1, type=int)
    region = request.args.get('region', '').strip()
    level = request.args.get('level', '').strip()
    map_type = request.args.get('type', '').strip()
    search = request.args.get('search', '').strip()
    level_sort = request.args.get('level_sort', 'none')

    session = SessionLocal()
    try:
        query = session.query(MapList)
        if region:
            if region == '全区':
                # 筛选"全区"：显示所有地图
                pass  # 不添加任何筛选条件，显示所有地图
            elif '/' in region:
                # 多选大区筛选
                regions = [r.strip() for r in region.split('/')]
                if regions:
                    # 条件1：匹配任意一个单选大区
                    single_region_conditions = [MapList.region == r for r in regions]
                    
                    # 条件2：匹配包含任意一个选中大区的多选大区地图
                    multi_region_conditions = []
                    for r in regions:
                        multi_region_conditions.append(MapList.region.like(f'%{r}%'))
                    
                    # 条件3：匹配"全区"地图（因为"全区"地图在所有大区都存在）
                    all_region_condition = MapList.region == '全区'
                    
                    # 组合条件：单选大区 OR 包含任意一个选中大区的多选大区 OR 全区地图
                    query = query.filter(
                        or_(
                            *single_region_conditions,  # 匹配任意一个单选大区
                            *multi_region_conditions,  # 匹配包含任意一个选中大区的多选大区
                            all_region_condition       # 匹配"全区"地图
                        )
                    )
            else:
                # 单选大区：显示该大区的地图 + 包含该大区的多选大区地图 + 全区地图
                query = query.filter(
                    or_(
                        MapList.region == region,  # 匹配单选大区
                        MapList.region.like(f'%{region}%'),  # 匹配包含该大区的多选大区
                        MapList.region == '全区'  # 匹配"全区"地图
                    )
                )
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
        
        # 排序逻辑
        if level_sort in ['asc', 'desc']:
            level_order = [
                '入门', '初级', '中级', '中级+', '高级', '高级+', '骨灰', '骨灰+',
                '火星', '火星+', '极限(1)', '极限(2)', '极限(3)', '极限(4)',
                '死亡(1)', '死亡(2)', '死亡(3)', '死亡(4)'
            ]
            case_expr = "CASE " + " ".join([f"WHEN level='{lv}' THEN {i}" for i, lv in enumerate(level_order)]) + " ELSE 999 END"
            if level_sort == 'asc':
                query = query.order_by(text(case_expr))
            else:
                query = query.order_by(text(f"{case_expr} DESC"))
        else:
            query = query.order_by(MapList.id.asc())
        
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
    image_url = ""

    # 新增：region 必填校验
    if not region:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'msg': '请选择地图大区'})
        flash('请选择地图大区')
        return redirect(url_for('maplist.mainpage'))

    session = SessionLocal()
    try:
        # 新增：检测地图是否重复（图名+作者+大区）
        exist_map = session.query(MapList).filter_by(name=name, region=region, mapper=mapper).first()
        if exist_map:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'msg': '该地图（名称+大区+作者）已存在，不能重复申请！'})
            flash('该地图（名称+大区+作者）已存在，不能重复申请！')
            return redirect(url_for('maplist.mainpage'))
        
        # 新增：检测申请表中是否有待审核的重复申请
        exist_apply = session.query(MapApply).filter_by(name=name, region=region, mapper=mapper, status='待审核').first()
        if exist_apply:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'msg': '您已提交过相同的申请，请勿重复提交！'})
            flash('您已提交过相同的申请，请勿重复提交！')
            return redirect(url_for('maplist.mainpage'))
        
        # 处理图片上传
        if image_file and image_file.filename:
            try:
                print(f"开始上传图片: {image_file.filename}")
                image_url = upload_image(image_file)
                if not image_url:
                    print("图片上传失败，但继续处理申请")
                    image_url = ""  # 确保为空字符串而不是None
                else:
                    print(f"图片上传成功: {image_url}")
            except Exception as e:
                print(f"图片上传异常: {e}")
                image_url = ""  # 确保为空字符串而不是None
                # 图片上传异常，但不阻止申请提交
        
        new_apply = MapApply(
            type='add',
            map_id=None,
            name=name,
            region=region,
            mapper=mapper,
            level=level,
            maptype=map_type,
            image=image_url,
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
        print(f"申请提交失败: {e}")
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

# =====================
# 路由：测试ImgBB连接
# =====================
@maplist_bp.route('/test/imgbb')
def test_imgbb():
    """测试ImgBB API连接"""
    import requests
    
    if not IMGBB_API_KEY:
        return jsonify({
            'success': False, 
            'msg': 'ImgBB API密钥未配置',
            'api_key_configured': False
        })
    
    try:
        # 测试连接
        response = requests.get('https://api.imgbb.com/1/upload', timeout=10)
        return jsonify({
            'success': True,
            'msg': 'ImgBB API连接正常',
            'api_key_configured': True,
            'connection_test': 'success',
            'response_status': response.status_code
        })
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'msg': '无法连接到ImgBB API，请检查网络连接',
            'api_key_configured': True,
            'connection_test': 'connection_error'
        })
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'msg': 'ImgBB API连接超时',
            'api_key_configured': True,
            'connection_test': 'timeout'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'msg': f'ImgBB API测试失败: {str(e)}',
            'api_key_configured': True,
            'connection_test': 'unknown_error'
        })

# =====================
# 路由：地图详情页
# =====================
@maplist_bp.route('/map/<int:map_id>', methods=['GET'])
def map_detail(map_id):
    """地图详情页，展示地图详细信息和记录"""
    session = SessionLocal()
    try:
        map_obj = session.query(MapList).filter_by(id=map_id).first()
        if not map_obj:
            return "地图不存在", 404
        # 查询所有通过记录
        from models import MapUpload, User
        all_records = session.query(MapUpload, User).join(User, MapUpload.user_id == User.id).filter(
            MapUpload.maplist_id == map_id,
            MapUpload.status == 'approve'
        ).all()
        # 分mode分组，筛选每个用户最快一条
        pro_dict = {}
        nub_dict = {}
        for r, user in all_records:
            key = r.user_id
            if r.mode == 'pro':
                if key not in pro_dict or \
                   (r.finish_time < pro_dict[key][0].finish_time) or \
                   (r.finish_time == pro_dict[key][0].finish_time and r.upload_time < pro_dict[key][0].upload_time):
                    pro_dict[key] = (r, user)
            elif r.mode == 'nub':
                if key not in nub_dict or \
                   (r.finish_time < nub_dict[key][0].finish_time) or \
                   (r.finish_time == nub_dict[key][0].finish_time and r.upload_time < nub_dict[key][0].upload_time):
                    nub_dict[key] = (r, user)
        pro_records = sorted([v for v in pro_dict.values()], key=lambda x: (x[0].finish_time, x[0].upload_time))
        nub_records = sorted([v for v in nub_dict.values()], key=lambda x: (x[0].finish_time, x[0].upload_time))
        return render_template('map_detail.html', map=map_obj, pro_records=pro_records, nub_records=nub_records, difficulty_class=get_difficulty_class(map_obj.level))
    finally:
        session.close()

@maplist_bp.route('/api/map_record_brief')
def api_map_record_brief():
    """返回指定地图的裸跳/存点模式第一名记录，供主页面悬浮窗使用"""
    from models import SessionLocal, MapUpload, User
    map_id = request.args.get('map_id', type=int)
    if not map_id:
        return jsonify({'pro': None, 'nub': None})
    session = SessionLocal()
    try:
        # 查询所有通过的记录
        all_records = session.query(MapUpload, User).join(User, MapUpload.user_id == User.id).filter(
            MapUpload.maplist_id == map_id,
            MapUpload.status == 'approve'
        ).all()
        # 分mode分组，筛选最快一条
        pro_best = None
        nub_best = None
        for r, user in all_records:
            if r.mode == 'pro':
                if (pro_best is None) or (r.finish_time < pro_best[0].finish_time) or (r.finish_time == pro_best[0].finish_time and r.upload_time < pro_best[0].upload_time):
                    pro_best = (r, user)
            elif r.mode == 'nub':
                if (nub_best is None) or (r.finish_time < nub_best[0].finish_time) or (r.finish_time == nub_best[0].finish_time and r.upload_time < nub_best[0].upload_time):
                    nub_best = (r, user)
        def fmt_time(t):
            if t is None:
                return '-'
            m = int(t // 60)
            s = t % 60
            return f"{m:02d}:{s:05.2f}" if m > 0 else f"{s:05.2f}"
        def rec_to_dict(tup):
            if not tup:
                return None
            r, user = tup
            return {
                'time': fmt_time(r.finish_time),
                'nickname': user.nickname or user.username or '-',
                'is_wr': (getattr(r, 'is_wr', 'N') == 'Y')
            }
        return jsonify({
            'pro': rec_to_dict(pro_best),
            'nub': rec_to_dict(nub_best)
        })
    finally:
        session.close()

def get_difficulty_class(level):
    if level in ['入门', '初级']:
        return 'difficulty-junior'
    elif level in ['中级', '中级+']:
        return 'difficulty-middle'
    elif level in ['高级', '高级+']:
        return 'difficulty-high'
    elif level in ['骨灰', '骨灰+']:
        return 'difficulty-legend'
    elif level in ['火星', '火星+']:
        return 'difficulty-mars'
    elif level and level.startswith('极限'):
        return 'difficulty-extreme'
    elif level and level.startswith('死亡'):
        return 'difficulty-death'
    else:
        return 'difficulty-junior'
