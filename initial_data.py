from main import  app
from backend.sec import datastore
from backend.models import db
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
    datastore.find_or_create_role(name="admin", description="User is an admin")
    datastore.find_or_create_role(name="professional", description="User is a service professional")
    datastore.find_or_create_role(name="customer", description="User is a customer")
    db.session.commit()
    if not datastore.find_user(email="admin@email.com"):
        datastore.create_user(
            email="admin@email.com", password=generate_password_hash("admin"), roles=["admin"],
            location="Chennai", pincode="600001")
    if not datastore.find_user(email="professional1@email.com"):
        datastore.create_user(
            email="professional1@email.com", username="professional1", password=generate_password_hash("prof1"), roles=["professional"], active=False,service_type="Plumbing", experience_years=5,
            location="Chennai", pincode="600001", document_url="https://example.com/document.pdf")
    if not datastore.find_user(email="customer1@email.com"):
        datastore.create_user(
            email="customer1@email.com", username="customer1", password=generate_password_hash("cust1"), roles=["customer"], location="Chennai", pincode="600001")
    db.session.commit()

with app.app_context():
    db.create_all()
    # Create home services
    from backend.models import Service
    
    if not Service.query.filter_by(name="House Cleaning").first():
        cleaning_service = Service(
            name="House Cleaning",
            description="Professional house cleaning service including dusting, vacuuming, mopping and bathroom cleaning",
            price=80.00,
            time_required=1.5
        )
        db.session.add(cleaning_service)

    if not Service.query.filter_by(name="Plumbing").first():
        plumbing_service = Service(
            name="Plumbing", 
            description="Expert plumbing services including repairs, installations and maintenance",
            price=100.00,
            time_required=2.0
        )
        db.session.add(plumbing_service)

    if not Service.query.filter_by(name="Electrical Work").first():
        electrical_service = Service(
            name="Electrical Work",
            description="Licensed electrician services for repairs, installations and safety inspections",
            price=120.00,
            time_required=2.5
        )
        db.session.add(electrical_service)

    db.session.commit()