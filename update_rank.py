from models import SessionLocal, DetailProfile

def update_user_ranks():
    db = SessionLocal()
    try:
        # 只统计pro或nub任意一个不为0的用户
        profiles = db.query(DetailProfile).filter(
            (DetailProfile.pro != 0) | (DetailProfile.nub != 0)
        ).order_by(
            DetailProfile.wrcounts.desc(),
            DetailProfile.scores.desc()
        ).all()
        # 依次赋排名
        for idx, profile in enumerate(profiles, start=1):
            profile.user_rank = idx
        # 其余用户排名设为None
        excluded_profiles = db.query(DetailProfile).filter(
            (DetailProfile.pro == 0) & (DetailProfile.nub == 0)
        ).all()
        for profile in excluded_profiles:
            profile.user_rank = None
        db.commit()
        print("排名已更新")
    except Exception as e:
        db.rollback()
        print("排名更新失败：", e)
    finally:
        db.close()

if __name__ == '__main__':
    update_user_ranks() 