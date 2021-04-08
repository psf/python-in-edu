# PythoninEdu-Test-Respository

## Running the site locally

Checkout this repo and install requirements.
```
$ git clone https://github.com/psf/python-in-edu.git
$ cd python-in-edu
$ python3 -m venv .venv
$ source .venv/bin/activate
$ pip install -r requirements.txt
```

Next, there are two options for running the application:

**Option 1:**

You'll need a [heroku cli installed on your system](https://devcenter.heroku.com/articles/heroku-local).

Once you have heroku cli installed on your computer, simply run:
```
$ heroku local
```

**Option 2:**

Change directories into the python-in-edu folder and run the following command in the terminal:
```
python manage.py runserver
```

## Development notes

We use the [Spirit project](https://spirit-project.com/) for our forums.

To test emails when developing, you'll need to [run a simple SMTP server](https://docs.djangoproject.com/en/3.1/topics/email/#configuring-email-for-development):

    python -m smtpd -n -c DebuggingServer localhost:1025