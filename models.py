from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import config
from datetime import datetime

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
    type = Column(Enum('连跳', '攀岩', '连跳/攀岩', '长跳', '滑坡', '其它', name='map_type'), nullable=False, default='连跳')
    image = Column(String(255))  # 恢复图片路径字段

# 统一用户表
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default='user')  # 'user', 'admin', 'temp_user'
    create_time = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)

class MapApply(Base):
    __tablename__ = 'map_apply'
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(10))  # add 或 edit
    map_id = Column(Integer)   # 申请修改时关联原地图id
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
    map_id = Column(Integer, nullable=False)  # 关联的地图ID
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
    origin_apply_id = Column(Integer)  # 来源申请ID（如有）

class Advice(Base):
    __tablename__ = 'advice'
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String(500), nullable=False)
    create_time = Column(DateTime, default=datetime.now)