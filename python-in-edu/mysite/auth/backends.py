from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class _AuthBackend(ModelBackend):

    def get_user(self, user_id):
        try:
            return (
                User._default_manager
                .get(pk=user_id))
        except User.DoesNotExist:
            pass


class EmailAuthBackend(_AuthBackend):

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)

        try:
            user = User._default_manager.get(email=username)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            User().set_password(password)
        else:
            if (user.check_password(password) and
                    self.user_can_authenticate(user)):
                return user


class UsernameAuthBackend(_AuthBackend):

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        return super(UsernameAuthBackend, self).authenticate(
            request, username=username, password=password, **kwargs)
