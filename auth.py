from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, User
from functools import wraps
import re

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

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """用户注册"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        agree_terms = request.form.get('agree_terms')
        
        # 表单验证
        errors = []
        
        # 用户名验证
        if not username or len(username) < 3:
            errors.append('用户名至少需要3个字符')
        elif len(username) > 20:
            errors.append('用户名不能超过20个字符')
        elif not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', username):
            errors.append('用户名只能包含字母、数字、下划线和中文')
        
        # 邮箱验证
        if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            errors.append('请输入有效的邮箱地址')
        
        # 密码验证
        if not password or len(password) < 6:
            errors.append('密码至少需要6个字符')
        elif password != confirm_password:
            errors.append('两次输入的密码不一致')
        
        # 协议同意验证
        if not agree_terms:
            errors.append('请同意用户协议和隐私政策')
        
        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')
        
        session_db = SessionLocal()
        try:
            # 检查用户名是否已存在
            existing_user = session_db.query(User).filter_by(username=username).first()
            if existing_user:
                flash('用户名已存在', 'error')
                return render_template('register.html')
            
            # 检查邮箱是否已存在
            existing_email = session_db.query(User).filter_by(email=email).first()
            if existing_email:
                flash('邮箱已被注册', 'error')
                return render_template('register.html')
            
            # 创建新用户
            new_user = User(
                username=username,
                email=email,
                role='user'
            )
            new_user.set_password(password)
            
            session_db.add(new_user)
            session_db.commit()
            
            flash('注册成功！请使用新账号登录', 'success')
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            session_db.rollback()
            flash('注册失败，请稍后重试', 'error')
            print(f"注册错误: {e}")
        finally:
            session_db.close()
    
    return render_template('register.html')

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
    response = redirect(url_for('maplist.mainpage'))
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