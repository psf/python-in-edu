# Contributing to Python in Eduucation

:tada: Thanks for taking the time to contribute! :tada:

First, we encourage you to introduce yourself to the community [in our forums](http://education.python.org/forum/category/3/introductions/) before leaping into action.

Once you've done that, our [issue tracker](https://github.com/psf/python-in-edu/issues) has open bugs, feature requests, etc. for you to chose from.

Finally, and most importantly, all contributors must agree to abide by our [Code of Conduct](https://github.com/psf/python-in-edu/blob/master/code_of_conduct.md).

With all of that in mind, here's how to get started with your contribution!

## Table of Contents

- [Contributing to Python in Eduucation](#contributing-to-python-in-eduucation)
  - [Table of Contents](#table-of-contents)
  - [Installation Guide](#installation-guide)
    - [Prerequisites](#prerequisites)
      - [Optional dependencies](#optional-dependencies)
    - [Project setup](#project-setup)
      - [1. Fork the repository](#1-fork-the-repository)
      - [2. Use Git to clone your fork of the repository](#2-use-git-to-clone-your-fork-of-the-repository)
      - [3. Create a Python virtual environment for the project](#3-create-a-python-virtual-environment-for-the-project)
      - [4. Install the development dependencies for the project](#4-install-the-development-dependencies-for-the-project)
      - [5. Run migrations & create a Django super user](#5-run-migrations--create-a-django-super-user)
  - [Running the site locally](#running-the-site-locally)

## Installation Guide

### Prerequisites

There are some operating-system specific libraries and dependencies you'll need to have installed before you can install the dependencies for our Django app. 

Specifically, because our application relies on [Pillow](https://pillow.readthedocs.io/en/latest/index.html) you'll need to ensure that `libjpeg` is installed in your system prior to installing our Python specific dependencies.

- **On Windows:** You shouldn't need to do anything. Please [open an issue](https://github.com/psf/python-in-edu/issues/new) and let us know if that's not the case!
- **On macOS:** `libjpeg` can be installed with [Homebrew](https://brew.sh/) by running `brew install jpeg` in your terminal
- **On Linux:** `libjpeg` will be provided by your specific distro's package manager. For example, in Ubuntu/Debian you would install `libjepeg` by running `sudo apt install libjpeg-dev` in your terminal

#### Optional dependencies

This Django app is deployed to Heroku, so if you'd like to have your development environment mirror production as closely as possible, you'll want to install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) so you can use `heroku local` to serve the application locally, rather than `python manage.py runserver`.

However, this is completely optional.

### Project setup

Now that our [prerequisites](#prerequisites) are installed. We can configure our development environment

**NOTE:** The following instructions assume very little familiarity with Git, GitHub, and contributing to Python/Django open source projects. If you're already a pro at contributing to open source, feel free to skim our setup instructions and then get to work.


#### 1. Fork the repository

First, [fork the repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) so that you have your own copy of the application to work from.

The easiest way to do this is to [click the "Fork" button in the top right hand side of this page](https://github.com/psf/python-in-edu/fork). Alternatively, if you prefer to use the [GitHub CLI](https://cli.github.com/), you can fork the repository by running:

```shell
gh repo fork psf/python-in-edu
```

#### 2. Use Git to clone your fork of the repository

Now that your repository has been forked, you'll want to clone that forked version of the repository to your computer using Git. There are two ways to do this.

The first, using Git itself in your terminal, is done by running the following command:

```shell
# Replace $YOUR_GITHUB_USERNAME with your actual GitHub username
git clone https://github.com/$YOUR_GITHUB_USERNAME/python-in-edu
```

The second, if you prefer to use the [GitHub CLI](https://cli.github.com/), is as follows:

```shell
# Replace $YOUR_GITHUB_USERNAME with your actual GitHub username
gh repo clone $YOUR_GITHUB_USERNAME/python-in-edu
```

Finally, you'll want to move your terminal into that directory using the `cd` command:

```shell
cd python-in-edu
```

#### 3. Create a Python virtual environment for the project

It's always a good idea to create a new [virtual environment](https://docs.python.org/3/tutorial/venv.html) for every Python project you work on.

To do this, we'll use the `venv` module in the Python standard library:

```shell
python -m venv .venv
```

This will create a new directory in your local repository named `.venv`.

We then need to "activate" that virtual environment to ensure that any packages we install are only installed for that project and not for the rest of our computer.

To do that, run the appropriate "activate" command for your operating system, shown below:

```shell
# on macOS and *nix run:
source .venv/bin/activate

# on Windows run:
.venv\Scripts\activate.bat
```

#### 4. Install the development dependencies for the project

We've just forked the repository, cloned it to our computer, and created/activated a Python virtual environment. It's finally safe for us to install the project's dependencies using pip.

The dependencies in this project are broken into requirements files for specific environments. For local development, you only need to install the dependencies declared in the `requirements/dev.txt` requirements file.

If you've never done this before, you can tell pip to install all of the dependencies listed in a that specific file by running the follwing command from the root directory of the repository:

```shell
pip install -r requirements/dev.txt
```

#### 5. Run migrations & create a Django super user

Finally, in order to administer the site locally, you'll need to create a local database to work with and a Django super user so that you can log in to the Django Admin.

Make sure that you're in the `python-in-edu` directory that contains the `mangage.py` file in your terminal, and then run the following commands:

```shell
# This command creates the database for us
python manage.py migrate

# This command walks us through creating a super user
python manage.py createsuperuser
```

Congrats! You're now ready to start contributing to Python in Education. :tada:

Be sure to [create a new branch](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging) for your work, and [open a Pull Request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request) on GitHub whenever you're ready for someone to review your code. If you're new to Git, we'd also highly recommend reading through this guide on [how to write good commit messages](https://chris.beams.io/posts/git-commit/).

## Running the site locally

Assuming that you've [installed and confugred the project as described above](#project-setup) you can run the Django application locally using Django's built-in development server:

```shell
python manage.py runserver
```

Alternatively, if you've installed the [heroku CLI](https://devcenter.heroku.com/articles/heroku-local), you can run the application using our production configuration:

```shell
# Must be run from the root of the repository, where Procfile is
heroku local
```

To runt he test suite, run:

```shell
python manage.py test
```

And finally, if you want to use or test email functionality locally, you'll need to [run a simple SMTP server](https://docs.djangoproject.com/en/3.1/topics/email/#configuring-email-for-development) in a separate terminal window/tab:

```shell
python -m smtpd -n -c DebuggingServer localhost:1025
```
