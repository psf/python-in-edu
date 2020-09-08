from flask import Flask
from flask_bootstrap import Bootstrap 

app = Flask(__name__)
from edu_web_app import front_end

bootstrap = Bootstrap(app)