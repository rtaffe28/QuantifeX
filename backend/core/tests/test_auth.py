"""Auth flow: registration, JWT token obtain/refresh, current-user endpoint."""
import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
class TestRegister:
    URL = "/api/user/register/"

    def test_register_creates_user(self, api_client):
        response = api_client.post(self.URL, {"username": "newuser", "password": "supersecret123"}, format="json")
        assert response.status_code == 201
        assert User.objects.filter(username="newuser").exists()

    def test_register_password_is_write_only(self, api_client):
        response = api_client.post(self.URL, {"username": "newuser2", "password": "supersecret123"}, format="json")
        assert "password" not in response.data

    def test_register_requires_username(self, api_client):
        response = api_client.post(self.URL, {"password": "supersecret123"}, format="json")
        assert response.status_code == 400
        assert "username" in response.data

    def test_register_requires_password(self, api_client):
        response = api_client.post(self.URL, {"username": "nopass"}, format="json")
        assert response.status_code == 400
        assert "password" in response.data

    def test_register_duplicate_username_rejected(self, api_client, make_user):
        make_user(username="dup")
        response = api_client.post(self.URL, {"username": "dup", "password": "anything12345"}, format="json")
        assert response.status_code == 400

    def test_register_hashes_password(self, api_client):
        api_client.post(self.URL, {"username": "hasher", "password": "plaintext1234"}, format="json")
        user = User.objects.get(username="hasher")
        assert user.password != "plaintext1234"
        assert user.check_password("plaintext1234")


@pytest.mark.django_db
class TestTokenObtain:
    URL = "/api/token/"

    def test_valid_credentials_return_tokens(self, api_client, make_user):
        make_user(username="tobi", password="goodpassword12")
        response = api_client.post(self.URL, {"username": "tobi", "password": "goodpassword12"}, format="json")
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_invalid_password_returns_401(self, api_client, make_user):
        make_user(username="tobi2", password="goodpassword12")
        response = api_client.post(self.URL, {"username": "tobi2", "password": "wrong"}, format="json")
        assert response.status_code == 401

    def test_unknown_user_returns_401(self, api_client):
        response = api_client.post(self.URL, {"username": "ghost", "password": "doesntmatter"}, format="json")
        assert response.status_code == 401


@pytest.mark.django_db
class TestTokenRefresh:
    REFRESH_URL = "/api/token/refresh/"
    OBTAIN_URL = "/api/token/"

    def test_refresh_returns_new_access(self, api_client, make_user):
        make_user(username="ref", password="goodpassword12")
        tokens = api_client.post(self.OBTAIN_URL, {"username": "ref", "password": "goodpassword12"}, format="json").data
        response = api_client.post(self.REFRESH_URL, {"refresh": tokens["refresh"]}, format="json")
        assert response.status_code == 200
        assert "access" in response.data

    def test_invalid_refresh_rejected(self, api_client):
        response = api_client.post(self.REFRESH_URL, {"refresh": "not-a-real-token"}, format="json")
        assert response.status_code == 401


@pytest.mark.django_db
class TestUserDetail:
    URL = "/api/user/"

    def test_authenticated_user_can_get_self(self, auth_client, user):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        assert response.data["id"] == user.id
        assert response.data["username"] == user.username

    def test_anonymous_cannot_access(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401
