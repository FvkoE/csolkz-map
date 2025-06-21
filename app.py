from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os

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
    app.register_blueprint(maplist_bp)
    app.register_blueprint(admin_bp)
    
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
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)   
