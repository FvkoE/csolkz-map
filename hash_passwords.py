import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from config import config

# --- IMPORTANT ---
# This script is for a one-time migration to hash existing plaintext passwords.
#
# INSTRUCTIONS:
# 1. MAKE A BACKUP OF YOUR 'users' TABLE BEFORE RUNNING THIS SCRIPT.
# 2. You MUST first run the SQL command to rename the column:
#    ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL;
# 3. Place this script in the root directory of your Flask project.
# 4. Activate your virtual environment.
# 5. Run the script from your terminal: python hash_passwords.py
# 6. If you use a .env file to store your database credentials, make sure
#    this script can access them, or manually ensure the environment variables are set.

def migrate_passwords():
    """
    Hashes all plaintext passwords currently stored in the 'password_hash' column.
    """
    print("--- Starting Password Migration ---")

    # Load config and create DB session
    # Ensure you are using the correct configuration
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
            
            # Ensure current_password_val is a string
            if not isinstance(current_password_val, str):
                print(f"Warning: Password for user '{user.username}' is not a string. Skipping.")
                continue
            
            # Werkzeug hashes have a specific format, like 'pbkdf2:sha256:...'
            # This check prevents re-hashing an already hashed password.
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
    # If you use a .env file, uncomment the following lines:
    # from dotenv import load_dotenv
    # load_dotenv()
    migrate_passwords() 