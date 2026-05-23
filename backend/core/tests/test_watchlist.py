"""Watchlist CRUD + user isolation."""
import pytest
from core.models import Watchlist


@pytest.mark.django_db
class TestWatchlist:
    URL = "/api/watchlist/"

    def test_anonymous_cannot_list(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_anonymous_cannot_create(self, api_client):
        assert api_client.post(self.URL, {"ticker": "AAPL"}, format="json").status_code == 401

    def test_list_empty_by_default(self, auth_client):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        assert response.data == []

    def test_create_adds_for_current_user(self, auth_client, user):
        response = auth_client.post(self.URL, {"ticker": "AAPL"}, format="json")
        assert response.status_code == 201
        assert response.data["ticker"] == "AAPL"
        assert Watchlist.objects.filter(user=user, ticker="AAPL").exists()

    def test_user_cannot_assign_to_other_user(self, auth_client, user, other_user):
        """`user` field is read-only — supplying another user_id should be ignored."""
        response = auth_client.post(self.URL, {"ticker": "MSFT", "user": other_user.id}, format="json")
        assert response.status_code == 201
        item = Watchlist.objects.get(ticker="MSFT")
        assert item.user == user

    def test_list_only_returns_own_items(self, auth_client, other_auth_client, user, other_user):
        auth_client.post(self.URL, {"ticker": "AAPL"}, format="json")
        other_auth_client.post(self.URL, {"ticker": "MSFT"}, format="json")

        mine = auth_client.get(self.URL).data
        theirs = other_auth_client.get(self.URL).data
        assert [w["ticker"] for w in mine] == ["AAPL"]
        assert [w["ticker"] for w in theirs] == ["MSFT"]

    def test_delete_own_item(self, auth_client, user):
        item = Watchlist.objects.create(user=user, ticker="TSLA")
        response = auth_client.delete(f"/api/watchlist/delete/{item.id}/")
        assert response.status_code == 204
        assert not Watchlist.objects.filter(id=item.id).exists()

    def test_cannot_delete_other_users_item(self, auth_client, other_user):
        item = Watchlist.objects.create(user=other_user, ticker="NVDA")
        response = auth_client.delete(f"/api/watchlist/delete/{item.id}/")
        assert response.status_code == 404
        assert Watchlist.objects.filter(id=item.id).exists()

    def test_delete_unknown_id_returns_404(self, auth_client):
        assert auth_client.delete("/api/watchlist/delete/99999/").status_code == 404
