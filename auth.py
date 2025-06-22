from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, TempUser, AdminUser
from functools import wraps

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_logged_in'):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录 (支持普通用户和管理员)"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('用户名和密码不能为空', 'error')
            return render_template('login.html')
        
        session_db = SessionLocal()
        try:
            # 1. 检查临时用户表
            user = session_db.query(TempUser).filter_by(username=username, password=password).first()
            
            # 2. 如果不是临时用户，检查管理员表
            if not user:
                user = session_db.query(AdminUser).filter_by(username=username, password=password).first()

            if user:
                # 登录成功
                session['user_logged_in'] = True
                session['username'] = user.username
                session['user_id'] = user.id
                
                # 区分角色，解决 user_id 冲突风险
                if isinstance(user, AdminUser):
                    session['user_role'] = 'admin'
                else:
                    session['user_role'] = 'temp_user'

                flash('登录成功！', 'success')
                return redirect(url_for('maplist.mainpage'))
            else:
                flash('用户名或密码错误', 'error')
        finally:
            session_db.close()
    
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    """用户登出"""
    session.clear()
    flash('已退出登录', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/check_login')
def check_login():
    """检查登录状态（AJAX接口）"""
    if session.get('user_logged_in'):
        return jsonify({'logged_in': True, 'username': session.get('username')})
    else:
        return jsonify({'logged_in': False}) 