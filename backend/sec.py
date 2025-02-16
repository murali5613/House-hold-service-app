
from backend.models import User, Role, db
from flask_security import SQLAlchemyUserDatastore

datastore = SQLAlchemyUserDatastore(db, User, Role)
