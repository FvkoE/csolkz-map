from flask import Flask, request, jsonify, redirect, url_for, session
from dotenv import load_dotenv
import os
from flask import render_template

# 加载环境变量
load_dotenv()

from config import config
from models import SessionLocal, Advice

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
    
    @app.route('/profile')
    def profile():
        return render_template('profile.html')
    
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
