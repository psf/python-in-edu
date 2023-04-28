# Welcome to Python in Education

## Join the Community

We welcome contributions to this project! Our [issue tracker](https://github.com/psf/python-in-edu/issues) has open bugs, feature requests, etc. We encourage you to introduce yourself to the community [in our forums](http://education.python.org/forum/category/3/introductions/) before leaping into action.

All contributors must agree to abide by our [Code of Conduct](https://github.com/psf/python-in-edu/blob/master/code_of_conduct.md).

## Installation Guide

In order to run this site locally, you'll want to clone this repository and install the requirements (check the [Mac Troubleshooting](#mac-troubleshooting) section if you face any errors):

```
git clone https://github.com/psf/python-in-edu.git
cd python-in-edu
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
```

You can then change directories into the python-in-edu folder and build the database:

```
python manage.py migrate
```


To run the project locally, run the following command in the terminal:

```
python manage.py runserver
```

If you use [heroku cli installed on your system](https://devcenter.heroku.com/articles/heroku-local), simply run:

```
heroku local
```

To test, run:

```
python manage.py test
```

If you want to use or test email functionality locally, you'll need to [run a simple SMTP server](https://docs.djangoproject.com/en/3.1/topics/email/#configuring-email-for-development):

    python -m smtpd -n -c DebuggingServer localhost:1025

## Notes

We use the [Spirit project](https://spirit-project.com/) for our forums.

---

<h2 id="mac-troubleshooting">Mac Troubleshooting</h2>

### Postgres

If you don't have an installation of Postgres on your system, you might run into the following error:

```
Error: pg_config executable not found.
```

[Install Postgres](https://postgresapp.com/) to resolve this issue.

### Pillow

If your Pillow installation fails during installing the requirements with the following message:

```
The headers or library files could not be found for jpeg,
a required dependency when compiling Pillow from source.
```

You can resolve this by installing [jpeg](https://formulae.brew.sh/formula/jpeg) using [homebrew](https://brew.sh/).