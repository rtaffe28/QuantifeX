"""Smoke test: harness boots, fixtures resolve, DB works."""
import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
def test_user_can_be_created(make_user):
    user = make_user(username="alice")
    assert User.objects.filter(username="alice").exists()
    assert user.check_password("testpass123!")


@pytest.mark.django_db
def test_auth_client_is_authenticated(auth_client, user):
    response = auth_client.get("/api/user/")
    assert response.status_code == 200
    assert response.data["username"] == user.username


def test_api_client_unauthenticated_blocked(api_client):
    response = api_client.get("/api/user/")
    assert response.status_code == 401
