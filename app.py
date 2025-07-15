from flask import Flask, request, jsonify, redirect, url_for, session, abort
from dotenv import load_dotenv
import os
from flask import render_template

# 加载环境变量
load_dotenv()

from config import config
from models import SessionLocal, Advice, DetailProfile, User, MapList, MapUpload, UploadApply
from auth import login_required

def create_app(config_name='default'):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 注册蓝图
    from maplist import maplist_bp
    from admin import admin_bp
    from auth import auth_bp
    app.register_blueprint(maplist_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    
    @app.context_processor
    def inject_static_url_version():
        """
        自动为静态文件URL添加版本号，解决浏览器缓存问题。
        版本号使用文件的最后修改时间。
        """
        def static_url(filename):
            try:
                # 获取文件在服务器上的物理路径
                static_folder = app.static_folder or 'static'
                filepath = os.path.join(static_folder, filename)
                if os.path.exists(filepath):
                    # 获取文件修改时间作为版本号
                    version = int(os.path.getmtime(filepath))
                    return f"{url_for('static', filename=filename)}?v={version}"
            except Exception as e:
                # 如果出现错误，则返回不带版本号的URL
                print(f"无法为 {filename} 生成版本号: {e}")
            return url_for('static', filename=filename)
        return dict(static_url=static_url)
    
    @app.route('/')
    def index():
        """根路由重定向到主页面"""
        return redirect(url_for('maplist.mainpage'))
    
    @app.route('/health')
    def health_check():
        """健康检查端点，用于Render监控"""
        return jsonify({'status': 'healthy', 'message': 'CSOL Flask app is running'})
    
    @app.route('/advice/add', methods=['POST'])
    def add_advice():
        data = request.get_json()
        content = data.get('content', '').strip()
        if not content:
            return jsonify({'success': False, 'msg': '建议内容不能为空'})
        session = SessionLocal()
        try:
            advice = Advice(content=content)
            session.add(advice)
            session.commit()
            return jsonify({'success': True})
        except Exception as e:
            session.rollback()
            return jsonify({'success': False, 'msg': str(e)})
        finally:
            session.close()
    
    @app.route('/profile/<int:user_id>')
    def profile(user_id):
        db = SessionLocal()
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            db.close()
            return abort(404, description='用户不存在')
        # 查询所有已通过的map_upload记录
        records = db.query(MapUpload).filter_by(user_id=user_id, status='approve').all()
        # 难度排序规则
        level_order = [
            '入门', '初级', '中级', '中级+', '高级', '高级+', '骨灰', '骨灰+', '火星', '火星+',
            '极限(1)', '极限(2)', '极限(3)', '极限(4)', '死亡(1)', '死亡(2)', '死亡(3)', '死亡(4)'
        ]
        level_order_map = {name: i for i, name in enumerate(level_order)}
        # 只统计每个地图+每种模式下该用户最快（finish_time最小，upload_time最早）的一条记录
        best_record_dict = {}
        for r in records:
            key = (r.maplist_id, r.mode)
            if key not in best_record_dict:
                best_record_dict[key] = r
            else:
                old = best_record_dict[key]
                if (r.finish_time < old.finish_time) or (r.finish_time == old.finish_time and r.upload_time < old.upload_time):
                    best_record_dict[key] = r
        best_records = list(best_record_dict.values())
        # 统计
        total_score = 0
        total_first_clear_score = 0
        total_rank_score = 0
        pro_score = 0
        nub_score = 0
        wr_count = 0
        first_clear_count = 0
        pro_count = 0
        nub_count = 0
        highest_level = ''
        highest_level_idx = -1
        # 需要join maplist获取level
        maplist_dict = {}
        if best_records:
            maplist_ids = list(set([r.maplist_id for r in best_records]))
            maplist_objs = db.query(MapList).filter(MapList.id.in_(maplist_ids)).all()
            for m in maplist_objs:
                maplist_dict[m.id] = m
        for r in best_records:
            total_score += (r.score or 0) + (r.first_clear_score or 0)
            total_first_clear_score += (r.first_clear_score or 0)
            total_rank_score += (r.score or 0)
            if r.mode == 'pro':
                pro_score += (r.score or 0)
                pro_count += 1
            elif r.mode == 'nub':
                nub_score += (r.score or 0)
                nub_count += 1
            if getattr(r, 'is_wr', 'N') == 'Y':
                wr_count += 1
            if int(getattr(r, 'is_first_clear', 0)) == 1:
                first_clear_count += 1
            # 最高难度
            m = maplist_dict.get(r.maplist_id)
            if m:
                idx = level_order_map.get(m.level, -1)
                if idx > highest_level_idx:
                    highest_level_idx = idx
                    highest_level = m.level
        total_count = len(best_records)
        profile_stats = {
            'score': total_score,
            'score_float': total_rank_score,
            'first_clear_score': total_first_clear_score,
            'pro_score': pro_score,
            'nub_score': nub_score,
            'wrcounts': wr_count,
            'first_clear': first_clear_count,
            'highest_level': highest_level,
            'pro': pro_count,
            'nub': nub_count,
            'total_count': total_count
        }
        avatar_value = getattr(user, 'avatar', None)
        avatar_url = url_for('static', filename=avatar_value) if avatar_value else url_for('static', filename='default_avatar.svg')
        nickname_raw = getattr(user, 'nickname', None)
        username_raw = getattr(user, 'username', None)
        nickname = str(nickname_raw) if nickname_raw else ''
        username = str(username_raw) if username_raw else ''
        is_self = (session.get('user_id') == user_id)
        db.close()
        return render_template('profile.html',
            avatar_url=avatar_url,
            profile=None,
            profileStats=profile_stats,
            nickname=nickname,
            username=username,
            is_self=is_self
        )
    
    @app.route('/profile/update_nickname', methods=['POST'])
    def update_nickname():
        """更新用户昵称"""
        if not session.get('user_logged_in'):
            return jsonify({'success': False, 'message': '请先登录'})
        
        try:
            data = request.get_json()
            new_nickname = data.get('nickname', '').strip()
            
            if not new_nickname:
                return jsonify({'success': False, 'message': '昵称不能为空'})
            
            if len(new_nickname) > 20:
                return jsonify({'success': False, 'message': '昵称长度不能超过20个字符'})
            
            # 更新session中的昵称
            session['nickname'] = new_nickname
            
            # 这里可以添加数据库更新逻辑，如果需要的话
            # 例如：更新用户表中的nickname字段
            
            return jsonify({'success': True, 'message': '昵称更新成功'})
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'更新失败：{str(e)}'})
    
    @app.route('/profile')
    def my_profile():
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login'))
        return redirect(url_for('profile', user_id=user_id))
    
    @app.route('/upload')
    @login_required
    def upload():
        user_id = session.get('user_id')
        return render_template('upload.html', user_id=user_id)
    
    @app.route('/upload_record', methods=['POST'])
    @login_required
    def upload_record():
        data = request.get_json()
        print('DEBUG RAW DATA:', data)
        print('DEBUG resonable:', data.get('resonable'))
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'msg': '未登录'})
        required_fields = ['maplist_id', 'finish_time', 'user_rank', 'score', 'first_clear_score', 'mode', 'is_first_clear', 'video_url']
        for f in required_fields:
            if f not in data:
                return jsonify({'success': False, 'msg': f'缺少参数: {f}'})
        resonable = data.get('resonable')
        if resonable not in ('Y', 'N'):
            return jsonify({'success': False, 'msg': '请选择难度是否合理'})
        suggest_level = data.get('SUGGEST_LEVEL')
        db = SessionLocal()
        try:
            # 新增：查找该用户在该地图该模式下的最快成绩
            best = db.query(MapUpload).filter(
                MapUpload.user_id == user_id,
                MapUpload.maplist_id == data['maplist_id'],
                MapUpload.mode == data['mode'],  # 按模式区分
                MapUpload.status == 'approve'
            ).order_by(MapUpload.finish_time.asc(), MapUpload.upload_time.asc()).first()
            if best and data['finish_time'] >= best.finish_time:
                db.close()
                return jsonify({'success': False, 'msg': '你已上传过该模式下更快的成绩，无需重复提交！'})
            # 后端校验：存点模式下cp和tp必填且为非负整数
            if data['mode'] == 'nub':
                cp = data.get('cp')
                tp = data.get('tp')
                if cp is None or tp is None or str(cp).strip() == '' or str(tp).strip() == '' or int(cp) < 0 or int(tp) < 0:
                    db.close()
                    return jsonify({'success': False, 'msg': '存点模式下，存点和读点数量必须填写且为非负整数！'})
            upload = UploadApply(
                maplist_id = data['maplist_id'],
                user_id = user_id,
                finish_time = data['finish_time'],
                user_rank = data['user_rank'],
                score = data['score'],
                first_clear_score = data['first_clear_score'],
                mode = data['mode'],
                is_first_clear = bool(data['is_first_clear']),
                video_url = data['video_url'],
                status = 'pending',
                cp = data.get('cp'),
                tp = data.get('tp'),
                resonable = resonable,
                SUGGEST_LEVEL = suggest_level
            )
            db.add(upload)
            db.commit()
            return jsonify({'success': True, 'msg': '申请已提交，等待审核'})
        except Exception as e:
            db.rollback()
            return jsonify({'success': False, 'msg': str(e)})
        finally:
            db.close()
    
    @app.route('/api/map_search')
    def api_map_search():
        query = request.args.get('query', '').strip()
        if not query:
            return jsonify(success=False, msg='请输入地图ID或名称')
        session = SessionLocal()
        map_obj = None
        # 先按ID查找
        if query.isdigit():
            map_obj = session.query(MapList).filter_by(id=int(query)).first()
        # 再按名称模糊查找
        if not map_obj:
            map_obj = session.query(MapList).filter(MapList.name.like(f'%{query}%')).first()
        if not map_obj:
            session.close()
            return jsonify(success=False, msg='未找到地图')
        # 构造图片路径
        image_url = map_obj.image or ''
        if bool(image_url) and not str(image_url).startswith('/static/'):
            image_url = '/static/uploads/' + str(image_url)
        elif not bool(image_url):
            image_url = '/static/default_avatar.svg'
        data = {
            'id': map_obj.id,
            'name': map_obj.name,
            'region': map_obj.region,
            'level': map_obj.level,
            'mapper': map_obj.mapper,
            'type': map_obj.type,
            'image_url': image_url,
            'description': getattr(map_obj, 'note', '')
        }
        session.close()
        return jsonify(success=True, data=data)
    
    # 全局中间件：会话验证
    @app.before_request
    def validate_session():
        """验证会话有效性"""
        # 检查管理员会话
        if session.get('admin_logged_in'):
            # 验证管理员会话是否有效
            if not session.get('admin_username') or not session.get('admin_user_role'):
                # 会话数据不完整，清除管理员会话
                session.pop('admin_logged_in', None)
                session.pop('admin_username', None)
                session.pop('admin_user_id', None)
                session.pop('admin_user_role', None)
        
        # 检查普通用户会话
        if session.get('user_logged_in'):
            # 验证用户会话是否有效
            if not session.get('username') or not session.get('user_id'):
                # 会话数据不完整，清除用户会话
                session.clear()
    
    # 全局中间件：为认证页面设置缓存控制
    @app.after_request
    def add_cache_control_headers(response):
        """为认证页面添加缓存控制头，防止敏感信息被缓存"""
        # 检查是否是认证相关的页面
        if (request.endpoint and 
            ('admin' in request.endpoint or 
             'auth' in request.endpoint or
             'maplist' in request.endpoint)):
            
            # 对于登录页面，允许缓存但设置较短时间
            if 'login' in request.endpoint:
                response.headers['Cache-Control'] = 'public, max-age=3600'  # 1小时缓存
            else:
                # 对于敏感页面（已登录的页面），设置严格的缓存控制
                response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                response.headers['Pragma'] = 'no-cache'
                response.headers['Expires'] = '0'
                
                # 对于敏感页面，添加额外的安全头
                if 'admin' in request.endpoint:
                    response.headers['X-Frame-Options'] = 'DENY'
                    response.headers['X-Content-Type-Options'] = 'nosniff'
        
        return response
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)   
