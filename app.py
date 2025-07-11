from flask import Flask, request, jsonify, redirect, url_for, session, abort
from dotenv import load_dotenv
import os
from flask import render_template

# 加载环境变量
load_dotenv()

from config import config
from models import SessionLocal, Advice, DetailProfile, User, MapList
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
        profile = db.query(DetailProfile).filter_by(user_id=user_id).first()
        user = db.query(User).filter_by(id=user_id).first()
        if not profile or not user:
            db.close()
            return abort(404, description='用户详细信息不存在')
        # 构造 profileStats 字典
        profile_stats = {
            'score': profile.scores,
            'rank': profile.user_rank,
            'wrcounts': profile.wrcounts,
            'first_clear': profile.first_clear,
            'highest_level': profile.highest_level,
            'pro': profile.pro,
            'nub': profile.nub,
            'first_clear_score': getattr(profile, 'first_clear_score', 0),
            'score_float': getattr(profile, 'score', 0),
            'nubrecord': getattr(profile, 'nubrecord', 0),
        }
        avatar_value = getattr(user, 'avatar', None)
        avatar_url = url_for('static', filename=avatar_value) if avatar_value else url_for('static', filename='default_avatar.svg')
        nickname_raw = getattr(user, 'nickname', None)
        username_raw = getattr(user, 'username', None)
        nickname = str(nickname_raw) if nickname_raw else ''
        username = str(username_raw) if username_raw else ''
        print('nickname:', repr(nickname), 'username:', repr(username))
        is_self = (session.get('user_id') == user_id)
        db.close()
        return render_template('profile.html',
            avatar_url=avatar_url,
            profile=profile,
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
        return render_template('upload.html')
    
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
