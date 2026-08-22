from app import create_app
from extensions import db
from models.user import User , UserRole

app = create_app()


def seed_users():
    with app.app_context():

        if User.query.first():
            print("User already exits.")
            return

        owner = User(full_name="Fleetpesa owner",
                     phone ="0712345678",
                     password="password123",
                     role=UserRole.OWNER)

        driver = User(full_name="Fleetpesa Driver",
                      phone="0723456789",
                      password="password456",
                      role=UserRole.DRIVER)

        db.session.add_all([owner , driver])
        db.session.commit()
        print("User created successfully")

if __name__ == "__main__":
    seed_users()

        