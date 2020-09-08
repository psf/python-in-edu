from flask import render_template
from edu_web_app import app
#from edu_web_app.bootstrap_elements import nav


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/getting_started')
def getting_started():
    return render_template('getting_started.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')   

@app.route('/blog')
def blog():
    return render_template('blog.html') 

@app.route('/connect')
def connect():
    return render_template('connect.html')  


    # nav=nav

