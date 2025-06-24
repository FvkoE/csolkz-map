import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from config import config

##加密数据库密码，用于将明文密码加密为哈希密码
def migrate_passwords():

    print("--- Starting Password Migration ---")


    app_config = config.get(os.environ.get('DEPLOYMENT_ENV', 'default'))
    if not app_config:
        print(f"Error: Could not load configuration for DEPLOYMENT_ENV '{os.environ.get('DEPLOYMENT_ENV', 'default')}'.")
        return
        
    engine = create_engine(app_config.DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        users = session.query(User).all()
        updated_count = 0

        print(f"Found {len(users)} user(s) to process.")

        for user in users:
            current_password_val = user.password_hash
            

            if not isinstance(current_password_val, str):
                print(f"Warning: Password for user '{user.username}' is not a string. Skipping.")
                continue
            

            if not current_password_val.startswith(('pbkdf2:', 'scrypt:')):
                print(f"Hashing password for user: '{user.username}'...")
                user.set_password(current_password_val)
                updated_count += 1
            else:
                print(f"Password for user '{user.username}' appears to be already hashed. Skipping.")
        
        if updated_count > 0:
            session.commit()
            print(f"\n[SUCCESS] Successfully hashed and updated passwords for {updated_count} user(s).")
        else:
            print("\nNo passwords required hashing.")

    except Exception as e:
        session.rollback()
        print(f"\n[ERROR] An error occurred: {e}")
        print("Password migration failed. The transaction has been rolled back.")
    finally:
        session.close()
        print("--- Migration Process Finished ---")

if __name__ == '__main__':
    migrate_passwords() 