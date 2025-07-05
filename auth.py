from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, User
from functools import wraps
import re
import socket
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from email_utils import email_verification

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """验证邮箱地址的有效性"""
    if not email:
        return False, "请输入邮箱地址"
    
    # 基础格式验证
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "请输入有效的邮箱地址格式"
    
    # 检查邮箱长度
    if len(email) > 254:
        return False, "邮箱地址过长"
    
    # 检查邮箱域名
    try:
        domain = email.split('@')[1]
        if not domain or len(domain) < 2:
            return False, "邮箱域名无效"
        
        # 检查是否为常见无效域名
        invalid_domains = ['123.com', 'test.com', 'example.com', 'invalid.com', 'fake.com', 
                          'temp.com', 'dummy.com', 'fake.org', 'test.org']
        if domain.lower() in invalid_domains:
            return False, "请使用真实的邮箱地址"
        
        # 检查域名是否包含有效字符
        if not re.match(r'^[a-zA-Z0-9.-]+$', domain):
            return False, "邮箱域名包含无效字符"
        
        # 检查顶级域名长度
        tld = domain.split('.')[-1]
        if len(tld) < 2 or len(tld) > 6:
            return False, "邮箱域名格式不正确"
        
    except IndexError:
        return False, "邮箱地址格式错误"
    
    return True, "邮箱格式正确"

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
        nickname = request.form.get('nickname', '').strip()  # 新增昵称字段
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
        is_valid, message = validate_email(email)
        if not is_valid:
            errors.append(message)
        
        # 昵称验证（可选）
        if nickname and len(nickname) > 50:
            errors.append('昵称不能超过50个字符')
        
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
                nickname=nickname if nickname else username,  # 如果没有昵称，使用用户名
                role='user'
            )
            new_user.set_password(password)
            
            session_db.add(new_user)
            session_db.commit()
            
            # 注册成功后直接跳转到主页面
            flash('注册成功！请登录后完善个人信息', 'success')
            return redirect(url_for('maplist.mainpage'))
            
        except Exception as e:
            session_db.rollback()
            flash('注册失败，请稍后重试', 'error')
            print(f"注册错误: {e}")
        finally:
            session_db.close()
    
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录 (支持邮箱或用户名登录)"""
    if request.method == 'POST':
        login_input = request.form.get('username')  # 可能是用户名或邮箱
        password = request.form.get('password')
        
        if not login_input or not password:
            flash('用户名/邮箱和密码不能为空', 'error')
            return render_template('login.html')
        
        session_db = SessionLocal()
        try:
            # 判断输入的是邮箱还是用户名
            is_email = '@' in login_input
            
            if is_email:
                # 使用邮箱登录
                user = session_db.query(User).filter_by(
                    email=login_input,
                    is_active=True
                ).first()
            else:
                # 使用用户名登录
                user = session_db.query(User).filter_by(
                    username=login_input,
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
                
                # 存储用户头像和昵称信息
                if user.avatar is not None and user.avatar.strip():
                    # user.avatar已经包含了avatars/路径，直接使用
                    session['avatar_url'] = url_for('static', filename=user.avatar)
                else:
                    session['avatar_url'] = url_for('static', filename='default_avatar.svg')
                
                session['nickname'] = user.nickname if user.nickname is not None and user.nickname.strip() else user.username
                
                # 登录成功，显示成功消息
                flash('登录成功！', 'success')
                
                # 所有用户都重定向到主页面，管理员可以选择访问管理后台
                return redirect(url_for('maplist.mainpage'))
            else:
                flash('用户名/邮箱或密码错误', 'error')
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

@auth_bp.route('/check_profile_completion')
def check_profile_completion():
    """检查是否需要完善个人信息（AJAX接口）"""
    if not session.get('user_logged_in'):
        return jsonify({'needs_completion': False})
    
    # 从数据库中检查用户信息
    session_db = SessionLocal()
    try:
        user = session_db.query(User).filter_by(id=session.get('user_id')).first()
        if user:
            # 检查昵称和头像是否为空
            nickname = user.nickname if user.nickname is not None else ''
            avatar = user.avatar if user.avatar is not None else ''
            
            # 如果昵称为空或头像为空，则需要完善信息
            needs_completion = (not nickname.strip() or not avatar.strip())
            
            if needs_completion:
                return jsonify({'needs_completion': True})
            else:
                return jsonify({'needs_completion': False})
        else:
            return jsonify({'needs_completion': False})
    except Exception as e:
        print(f"检查个人信息完善状态错误: {e}")
        return jsonify({'needs_completion': False})
    finally:
        session_db.close()

@auth_bp.route('/profile/complete', methods=['GET', 'POST'])
@login_required
def complete_profile():
    """用户首次注册后完善个人信息"""
    if request.method == 'POST':
        nickname = request.form.get('nickname', '').strip()
        avatar_file = request.files.get('avatar')
        
        # 验证昵称
        if not nickname:
            if request.headers.get('Content-Type', '').startswith('application/json'):
                return jsonify({'success': False, 'message': '请输入游戏昵称'})
            flash('请输入游戏昵称', 'error')
            return render_template('complete_profile.html')
        
        if len(nickname) > 50:
            if request.headers.get('Content-Type', '').startswith('application/json'):
                return jsonify({'success': False, 'message': '昵称不能超过50个字符'})
            flash('昵称不能超过50个字符', 'error')
            return render_template('complete_profile.html')
        
        # 验证头像文件
        if not avatar_file:
            if request.headers.get('Content-Type', '').startswith('application/json'):
                return jsonify({'success': False, 'message': '请选择头像图片'})
            flash('请选择头像图片', 'error')
            return render_template('complete_profile.html')
        
        # 检查文件类型
        if avatar_file.filename and not avatar_file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            if request.headers.get('Content-Type', '').startswith('application/json'):
                return jsonify({'success': False, 'message': '头像格式不支持，请选择PNG、JPG、JPEG、GIF或WEBP格式'})
            flash('头像格式不支持，请选择PNG、JPG、JPEG、GIF或WEBP格式', 'error')
            return render_template('complete_profile.html')
        
        session_db = SessionLocal()
        try:
            user = session_db.query(User).filter_by(id=session.get('user_id')).first()
            if user:
                # 保存头像文件
                import os
                from werkzeug.utils import secure_filename
                
                # 创建头像存储目录
                avatar_dir = os.path.join('static', 'avatars')
                if not os.path.exists(avatar_dir):
                    os.makedirs(avatar_dir)
                
                # 生成安全的文件名
                original_filename = avatar_file.filename or 'avatar'
                filename = secure_filename(original_filename)
                # 添加用户ID前缀，避免文件名冲突
                user_id = str(user.id)
                file_ext = os.path.splitext(filename)[1]
                # 使用用户ID作为文件名，确保一致性
                avatar_filename = f"user_{user_id}{file_ext}"
                avatar_path = os.path.join(avatar_dir, avatar_filename)
                
                # 保存文件
                avatar_file.save(avatar_path)
                
                # 更新用户信息
                user.nickname = str(nickname)
                user.avatar = str(f"avatars/{avatar_filename}")
                session_db.commit()
                
                # 更新session中的用户信息
                session['avatar_url'] = url_for('static', filename=f"avatars/{avatar_filename}")
                session['nickname'] = nickname
                
                if request.headers.get('Content-Type', '').startswith('application/json'):
                    return jsonify({'success': True, 'message': '个人信息完善成功！'})
                flash('个人信息完善成功！', 'success')
                return redirect(url_for('maplist.mainpage'))
            else:
                if request.headers.get('Content-Type', '').startswith('application/json'):
                    return jsonify({'success': False, 'message': '用户信息不存在'})
                flash('用户信息不存在', 'error')
        except Exception as e:
            session_db.rollback()
            error_msg = f'保存失败，请重试: {str(e)}'
            if request.headers.get('Content-Type', '').startswith('application/json'):
                return jsonify({'success': False, 'message': error_msg})
            flash('保存失败，请重试', 'error')
            print(f"完善个人信息错误: {e}")
        finally:
            session_db.close()
    
    return render_template('complete_profile.html')

@auth_bp.route('/send_verification_code', methods=['POST'])
def send_verification_code():
    """发送验证码"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        
        # 使用新的邮箱验证函数
        is_valid, message = validate_email(email)
        if not is_valid:
            return jsonify({'success': False, 'message': message})
        
        # 验证用户名
        if not username or len(username) < 3:
            return jsonify({'success': False, 'message': '用户名至少需要3个字符'})
        
        # 检查邮箱是否已被注册
        session_db = SessionLocal()
        try:
            existing_email = session_db.query(User).filter_by(email=email).first()
            if existing_email:
                return jsonify({'success': False, 'message': '该邮箱已被注册'})
        finally:
            session_db.close()
        
        # 发送验证码
        success, message = email_verification.send_verification_email(email, username)
        
        return jsonify({'success': success, 'message': message})
        
    except Exception as e:
        print(f"发送验证码错误: {e}")
        return jsonify({'success': False, 'message': '发送失败，请重试'}) 