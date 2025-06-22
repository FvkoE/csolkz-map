import argparse
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from config import config
## python manage_users.py create FvkoE jichengxin2009 --role admin
def get_session():
    """Helper function to create a database session."""
    app_config = config.get(os.environ.get('DEPLOYMENT_ENV', 'default'))
    if not app_config:
        raise ValueError("Could not load configuration.")
    engine = create_engine(app_config.DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    return Session()

def create_user(username, password, role):
    """Creates a new user with a hashed password."""
    session = get_session()
    try:
        # Check if user already exists
        existing_user = session.query(User).filter_by(username=username).first()
        if existing_user:
            print(f"Error: User '{username}' already exists.")
            return

        new_user = User(username=username, role=role)
        new_user.set_password(password)
        
        session.add(new_user)
        session.commit()
        print(f"Successfully created user '{username}' with role '{role}'.")
    except Exception as e:
        session.rollback()
        print(f"An error occurred: {e}")
    finally:
        session.close()

def update_password(username, new_password):
    """Updates the password for an existing user."""
    session = get_session()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            print(f"Error: User '{username}' not found.")
            return

        user.set_password(new_password)
        session.commit()
        print(f"Successfully updated password for user '{username}'.")
    except Exception as e:
        session.rollback()
        print(f"An error occurred: {e}")
    finally:
        session.close()

if __name__ == '__main__':
    # If you use a .env file, you might need to load it first
    # from dotenv import load_dotenv
    # load_dotenv()

    parser = argparse.ArgumentParser(description="User Management CLI")
    subparsers = parser.add_subparsers(dest='command', required=True)

    # 'create' command
    create_parser = subparsers.add_parser('create', help="Create a new user")
    create_parser.add_argument('username', type=str, help="The username for the new user")
    create_parser.add_argument('password', type=str, help="The password for the new user")
    create_parser.add_argument('--role', type=str, default='user', help="The role for the new user (e.g., 'admin', 'user')")

    # 'update-password' command
    update_parser = subparsers.add_parser('update-password', help="Update an existing user's password")
    update_parser.add_argument('username', type=str, help="The username of the user to update")
    update_parser.add_argument('new_password', help="The new password")

    args = parser.parse_args()

    if args.command == 'create':
        create_user(args.username, args.password, args.role)
    elif args.command == 'update-password':
        update_password(args.username, args.new_password) 
