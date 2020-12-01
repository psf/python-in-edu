from flask import Flask
from flask_bootstrap import Bootstrap 
from config import Config
from flask_sqlalchemy import SQLAlchemy 
from flask_migrate import Migrate 
from flask_login import LoginManager
from flask_mail import Mail

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
login = LoginManager(app)
login.login_view = 'login'
mail = Mail(app)
from edu_web_app import front_end, models
migrate = Migrate(app, db)
bootstrap = Bootstrap(app)
