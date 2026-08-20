"""
SmartSkale Admin & Credentials Management Utility
-------------------------------------------------
Use this CLI tool to:
1. Update existing admin email & password.
2. Create a new admin or HR user.
3. List all registered accounts in the system.

Usage Examples:
- Interactive mode:
    python manage_admin.py

- Update existing admin credentials:
    python manage_admin.py update --email your.email@example.com --password yournewpassword --name "Your Name"

- Create a new admin user:
    python manage_admin.py create --email your.email@example.com --password yourpassword --name "Your Name" --role admin

- List all users:
    python manage_admin.py list
"""

import sys
import argparse
from app.database import SessionLocal, engine, Base
from app.models.models import User, UserRole
from app.utils.security import get_password_hash

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("\n" + "=" * 65)
        print(f"{'ID':<5} | {'Full Name':<22} | {'Email':<25} | {'Role':<6}")
        print("=" * 65)
        for u in users:
            print(f"{u.id:<5} | {u.full_name:<22} | {u.email:<25} | {u.role:<6}")
        print("=" * 65 + "\n")
    finally:
        db.close()

def update_admin(new_email: str = None, new_password: str = None, new_name: str = None):
    db = SessionLocal()
    try:
        # Find first admin or first user
        user = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not user:
            user = db.query(User).first()

        if not user:
            print("❌ No user accounts found in the database. Please create one.")
            return

        print(f"\n🔄 Updating account: {user.email} (ID: {user.id})")
        if new_email:
            # Check if email is taken by someone else
            existing = db.query(User).filter(User.email == new_email.lower().strip(), User.id != user.id).first()
            if existing:
                print(f"❌ Error: Email '{new_email}' is already used by another user.")
                return
            user.email = new_email.lower().strip()
            print(f"  ✓ Email updated to: {user.email}")

        if new_password:
            user.hashed_password = get_password_hash(new_password)
            print("  ✓ Password successfully updated.")

        if new_name:
            user.full_name = new_name.strip()
            print(f"  ✓ Name updated to: {user.full_name}")

        db.commit()
        print("\n✅ Admin credentials updated successfully!\n")
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating admin: {e}")
    finally:
        db.close()

def create_user(email: str, password: str, name: str, role: str = "admin"):
    db = SessionLocal()
    try:
        email_clean = email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            print(f"❌ Error: User with email '{email_clean}' already exists.")
            return

        user = User(
            email=email_clean,
            hashed_password=get_password_hash(password),
            full_name=name.strip(),
            role=role.lower().strip(),
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"\n✅ Created user '{name}' ({email_clean}) with role '{role}' successfully!\n")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user: {e}")
    finally:
        db.close()

def interactive():
    print("=" * 55)
    print(" SmartSkale Account & Credentials Management ")
    print("=" * 55)
    print("1. Update existing Admin Account (Email / Password)")
    print("2. Create New Admin / HR Account")
    print("3. List all accounts")
    print("4. Exit")
    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        email = input("Enter new real email (or press Enter to keep current): ").strip()
        name = input("Enter your full name (or press Enter to keep current): ").strip()
        pwd = input("Enter new password (or press Enter to keep current): ").strip()
        update_admin(
            new_email=email if email else None,
            new_password=pwd if pwd else None,
            new_name=name if name else None
        )
    elif choice == "2":
        email = input("Enter email: ").strip()
        name = input("Enter full name: ").strip()
        pwd = input("Enter password: ").strip()
        role = input("Enter role (admin / hr) [default: admin]: ").strip() or "admin"
        if not email or not pwd or not name:
            print("❌ Email, password, and name are required.")
            return
        create_user(email, pwd, name, role)
    elif choice == "3":
        list_users()
    else:
        print("Exiting.")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    parser = argparse.ArgumentParser(description="Manage SmartSkale Admin credentials")
    subparsers = parser.add_subparsers(dest="command")

    # update command
    update_parser = subparsers.add_parser("update", help="Update existing admin credentials")
    update_parser.add_argument("--email", help="New email address")
    update_parser.add_argument("--password", help="New password")
    update_parser.add_argument("--name", help="New full name")

    # create command
    create_parser = subparsers.add_parser("create", help="Create a new user")
    create_parser.add_argument("--email", required=True, help="User email")
    create_parser.add_argument("--password", required=True, help="User password")
    create_parser.add_argument("--name", required=True, help="User full name")
    create_parser.add_argument("--role", default="admin", help="User role (admin/hr)")

    # list command
    subparsers.add_parser("list", help="List all registered accounts")

    args = parser.parse_args()

    if args.command == "update":
        update_admin(args.email, args.password, args.name)
    elif args.command == "create":
        create_user(args.email, args.password, args.name, args.role)
    elif args.command == "list":
        list_users()
    else:
        interactive()
