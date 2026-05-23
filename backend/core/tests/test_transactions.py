"""Transactions CRUD + user isolation."""
import pytest
from decimal import Decimal
from core.models import Transactions


def _payload(**over):
    base = {"date": "2025-06-15", "type": "buy", "description": "100 AAPL @ 150", "amount": "15000.00"}
    base.update(over)
    return base


@pytest.mark.django_db
class TestTransactions:
    URL = "/api/transactions/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401
        assert api_client.post(self.URL, _payload(), format="json").status_code == 401

    def test_list_empty_by_default(self, auth_client):
        assert auth_client.get(self.URL).data == []

    def test_create_persists_for_current_user(self, auth_client, user):
        response = auth_client.post(self.URL, _payload(), format="json")
        assert response.status_code == 201
        assert response.data["amount"] == "15000.00"
        assert Transactions.objects.filter(user=user).count() == 1

    def test_user_field_is_read_only(self, auth_client, user, other_user):
        auth_client.post(self.URL, _payload(user=other_user.id), format="json")
        assert Transactions.objects.first().user == user

    def test_list_returns_only_own_transactions(self, auth_client, other_auth_client, user, other_user):
        Transactions.objects.create(user=user, date="2025-06-01", type="buy", description="A", amount=Decimal("100"))
        Transactions.objects.create(user=other_user, date="2025-06-02", type="buy", description="B", amount=Decimal("200"))

        mine = auth_client.get(self.URL).data
        theirs = other_auth_client.get(self.URL).data
        assert len(mine) == 1 and mine[0]["description"] == "A"
        assert len(theirs) == 1 and theirs[0]["description"] == "B"

    def test_create_validation_missing_fields(self, auth_client):
        response = auth_client.post(self.URL, {"type": "buy"}, format="json")
        assert response.status_code == 400
        assert "date" in response.data
        assert "amount" in response.data

    def test_delete_own_transaction(self, auth_client, user):
        tx = Transactions.objects.create(user=user, date="2025-06-01", type="buy", description="X", amount=Decimal("1"))
        assert auth_client.delete(f"/api/transactions/delete/{tx.id}/").status_code == 204
        assert not Transactions.objects.filter(id=tx.id).exists()

    def test_cannot_delete_other_users_transaction(self, auth_client, other_user):
        tx = Transactions.objects.create(user=other_user, date="2025-06-01", type="buy", description="X", amount=Decimal("1"))
        response = auth_client.delete(f"/api/transactions/delete/{tx.id}/")
        assert response.status_code == 404
        assert Transactions.objects.filter(id=tx.id).exists()
