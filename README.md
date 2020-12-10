# PythoninEdu-Test-Respository

## Running the python-in-edu site locally
Checkout this repo and install requirements.
```
$ git clone https://github.com/psf/python-in-edu.git
$ cd python-in-edu
$ python3 -m venv .venv
$ source .venv/bin/activate
$ pip install -r requirements.txt
```
Next, there are two options for running the application:
- Option 1:

You'll need a [heroku cli installed on your system](https://devcenter.heroku.com/articles/heroku-local).

Once you have heroku cli installed on your computer, simply run:
```
$ heroku local
```
- Option 2:

Run the commands in the Procfile manually.
```
gunicorn main-mod:app --log-file -
```
