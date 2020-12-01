from flask import render_template, flash, redirect, request
from edu_web_app import app, db
#from edu_web_app.bootstrap_elements import nav
from edu_web_app.forms import LoginForm, RegistrationForm, ResetPasswordRequestForm, ResetPasswordForm
from edu_web_app.models import User, OER
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse
from edu_web_app.email import send_password_reset_email

@app.shell_context_processor
def make_shell_context():
    return {'db' : db, 'User' : User, 'OER' : OER}

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', title='Home Page', OER=OER)

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

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for ('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for ('login'))
    return render_template('register.html', title='Register', form=form)    

@app.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = ResetPasswordRequestForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            send_password_reset_email(user)
        flash('Check your email for the instructions to reset your password')
        return redirect(url_for('login'))
    return render_template('reset_password_request.html',
                           title='Reset Password', form=form)


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    user = User.verify_reset_password_token(token)
    if not user:
        return redirect(url_for('index'))
    form = ResetPasswordForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        db.session.commit()
        flash('Your password has been reset.')
        return redirect(url_for('login'))
    return render_template('reset_password.html', form=form)



@app.route('/logout')    
def logout():
    logout_user()
    return redirect(url_for('index'))

    # nav=nav

