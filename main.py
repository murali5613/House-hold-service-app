from flask import Flask
from flask_security import Security
from backend.models import db
from config import DevelopmentConfig
from backend.resources import api
from backend.sec import datastore
from backend.worker import celery_init_app
from celery.schedules import crontab
from backend.tasks import daily_reminder, customer_monthly_report
from backend.instances import cache

def create_app():
    app = Flask(__name__, template_folder='frontend', static_folder='frontend', static_url_path='/static')
    app.config.from_object(DevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    app.security = Security(app, datastore, register_blueprint=False)
    cache.init_app(app)
    with app.app_context():
        import backend.views

    return app

app = create_app()
celery_app = celery_init_app(app)

@celery_app.on_after_configure.connect
def send_mail(sender, **kwargs):

    sender.add_periodic_task(
        crontab(day_of_month=1, hour=6, minute=0),
        customer_monthly_report.s(),
    )

    sender.add_periodic_task(
        crontab(hour=20, minute=22),
        daily_reminder.s(),
    )

if __name__ == '__main__':  
    app.run(debug=True)
    