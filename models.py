from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Enum, ForeignKey, Date, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from werkzeug.security import generate_password_hash, check_password_hash
from config import config
from datetime import datetime, date

# 获取配置
app_config = config['default']
DATABASE_URL = app_config.DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MapList(Base):
    __tablename__ = 'maplist'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    region = Column(String(50), nullable=False)
    mapper = Column(String(50))
    level = Column(String(50), nullable=False)
    theory_level = Column(String(50), nullable=True, comment='理论难度')
    type = Column(Enum('连跳', '攀岩', '连跳/攀岩', '长跳', '滑坡', '其它', name='map_type'), nullable=False, comment='地图类型')
    image = Column(String(255))  # 恢复图片路径字段
    create_date = Column(Date, default=date.today, nullable=False, comment='上传日期')

# 统一用户表
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    nickname = Column(String(255), nullable=True)  # 昵称
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='user')  # 'user', 'admin', 'temp_user'
    create_time = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)
    email = Column(String(255), nullable=False)  # 邮箱，必填
    avatar = Column(String(255), nullable=True)  # 头像

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not isinstance(self.password_hash, str):
            return False
        return check_password_hash(self.password_hash, password)

class MapApply(Base):
    __tablename__ = 'map_apply'
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(10))  # add 或 edit
    map_id = Column(Integer, ForeignKey('maplist.id'))   # 申请修改时关联原地图id
    name = Column(String(50))
    region = Column(String(50))
    mapper = Column(String(50))
    level = Column(String(50))
    maptype = Column(Enum('连跳', '攀岩', '连跳/攀岩', '长跳', '滑坡', '其它', name='apply_map_type'), nullable=False, default='连跳')
    image = Column(String(255))
    note = Column(String(255))
    status = Column(String(20), default='待审核')  # 待审核/通过/拒绝
    create_time = Column(DateTime, default=datetime.now)
    update_time = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class MapHistory(Base):
    __tablename__ = 'map_history'
    id = Column(Integer, primary_key=True, autoincrement=True)
    map_id = Column(Integer, ForeignKey('maplist.id'), nullable=False)  # 关联的地图ID
    name = Column(String(50), nullable=False)
    region = Column(String(50), nullable=False)
    mapper = Column(String(50))
    level = Column(String(50), nullable=False)
    type = Column(Enum('连跳', '攀岩', '连跳/攀岩', '长跳', '滑坡', '其它', name='history_map_type'), nullable=False, default='连跳')
    image = Column(String(255))
    note = Column(String(255))
    action = Column(String(20), nullable=False)  # 操作类型（add/edit/delete/rollback）
    operator = Column(String(50), nullable=False)  # 操作人
    operate_time = Column(DateTime, default=datetime.now)
    origin_apply_id = Column(Integer, ForeignKey('map_apply.id'))  # 来源申请ID（如有）

class Advice(Base):
    __tablename__ = 'advice'
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String(500), nullable=False)
    create_time = Column(DateTime, default=datetime.now)

class DetailProfile(Base):
    __tablename__ = 'detail_profile'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    wrcounts = Column(Integer, default=0, nullable=False)
    scores = Column(Integer, default=0, nullable=False)
    first_clear = Column(Integer, default=0, nullable=False)
    user_rank = Column(Integer)
    highest_level = Column(String(255), default='', nullable=False)
    pro = Column(Integer, default=0, nullable=False)
    nub = Column(Integer, default=0, nullable=False)
    first_clear_score = Column(Float, default=0, nullable=False)
    score = Column(Float, default=0, nullable=False)
    nubrecord = Column(Integer, default=0, nullable=False)
    # 可根据表结构继续补充其它字段

class MapUpload(Base):
    __tablename__ = 'map_upload'
    id = Column(Integer, primary_key=True, autoincrement=True)
    maplist_id = Column(Integer, ForeignKey('maplist.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    finish_time = Column(Float, nullable=False)
    user_rank = Column(Integer, nullable=False)
    upload_time = Column(DateTime, default=datetime.now, nullable=False)
    score = Column(Integer, nullable=False)
    first_clear_score = Column(Integer, nullable=False)
    mode = Column(String(16), nullable=False)
    is_first_clear = Column(Boolean, default=False, nullable=False)
    video_url = Column(String(255), nullable=False)
    status = Column(Enum('approve','refuse','pending', name='upload_status'), default='pending')
    cp = Column(Integer)
    tp = Column(Integer)
    resonable = Column(Enum('Y','N', name='resonable_enum'), nullable=False)
    SUGGEST_LEVEL = Column(String(255))
    is_wr = Column(Enum('Y', 'N', name='is_wr_enum'), default='N', nullable=False)

class UploadApply(Base):
    __tablename__ = 'upload_apply'
    id = Column(Integer, primary_key=True, autoincrement=True)
    maplist_id = Column(Integer, ForeignKey('maplist.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    finish_time = Column(Float, nullable=False)
    user_rank = Column(Integer, nullable=False)
    upload_time = Column(DateTime, default=datetime.now, nullable=False)
    score = Column(Integer, nullable=False)
    first_clear_score = Column(Integer, nullable=False)
    mode = Column(String(16), nullable=False)
    is_first_clear = Column(Boolean, default=False, nullable=False)
    video_url = Column(String(255), nullable=False)
    status = Column(Enum('pending','approve','refuse', name='apply_status'), default='pending')
    cp = Column(Integer)
    tp = Column(Integer)
    resonable = Column(Enum('Y','N', name='apply_resonable_enum'), nullable=False)
    SUGGEST_LEVEL = Column(String(255))
    reviewer_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    review_time = Column(DateTime, nullable=True)
    reject_reason = Column(String(255), nullable=True)

class Role(Base):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(100))

class UserRole(Base):
    __tablename__ = 'user_role'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    role_id = Column(Integer, ForeignKey('role.id'), primary_key=True)

# 在User类中增加roles多对多关系
User.roles = relationship('Role', secondary='user_role', backref='users')