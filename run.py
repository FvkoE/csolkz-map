import os
import sys
from app import create_app

def main():
    """主函数"""
    # 设置环境变量
    env = os.environ.get('FLASK_ENV', 'development')
    
    # 创建应用
    app = create_app(env)
    
    # 运行应用
    if env == 'production':
        app.run(host='0.0.0.0', port=5000)
    else:
        app.run(debug=True, host='127.0.0.1', port=5000)

if __name__ == '__main__':
    main()