from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, User
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

def admin_required(f):
    """管理员权限验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否有管理员登录会话
        if session.get('admin_logged_in'):
            return f(*args, **kwargs)
        
        # 检查普通用户会话中的角色
        if session.get('user_logged_in') and session.get('user_role') == 'admin':
            # 如果普通用户是管理员，自动设置管理员会话，避免重复登录
            session['admin_logged_in'] = True
            session['admin_username'] = session.get('username')
            session['admin_user_id'] = session.get('user_id')
            session['admin_user_role'] = session.get('user_role')
            return f(*args, **kwargs)
        
        # 如果都没有，重定向到管理员登录页面
        flash('请先登录管理员账户', 'error')
        return redirect(url_for('admin.admin_login'))
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录 (统一用户表)"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('用户名和密码不能为空', 'error')
            return render_template('login.html')
        
        session_db = SessionLocal()
        try:
            # 使用统一的用户表进行查询
            user = session_db.query(User).filter_by(
                username=username,
                is_active=True
            ).first()

            if user and user.check_password(password):
                # 登录成功
                remember_me = request.form.get('remember_me') == 'on'
                if remember_me:
                    session.permanent = True  # 启用持久化会话
                else:
                    session.permanent = False  # 使用临时会话（浏览器关闭后失效）
                
                session['user_logged_in'] = True
                session['username'] = user.username
                session['user_id'] = user.id
                session['user_role'] = user.role
                
                flash('登录成功！', 'success')
                
                # 所有用户都重定向到主页面，管理员可以选择访问管理后台
                return redirect(url_for('maplist.mainpage'))
            else:
                flash('用户名或密码错误', 'error')
        finally:
            session_db.close()
    else:
        # GET请求时，清除之前的Flash消息，避免显示旧的"登录成功"消息
        session.pop('_flashes', None)
    
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    """用户登出"""
    # 清除所有会话数据
    session.clear()
    
    # 设置响应头，防止浏览器缓存
    response = redirect(url_for('auth.login'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    # 清除Flash消息
    session.pop('_flashes', None)
    
    flash('已退出登录', 'info')
    return response

@auth_bp.route('/check_login')
def check_login():
    """检查登录状态（AJAX接口）"""
    if session.get('user_logged_in'):
        return jsonify({
            'logged_in': True, 
            'username': session.get('username'),
            'role': session.get('user_role')
        })
    else:
        return jsonify({'logged_in': False}) 