"""Stock-ticker reference endpoint."""
import pytest
from core.models import StockTicker


@pytest.mark.django_db
class TestStockTickers:
    URL = "/api/tickers/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_returns_all_tickers(self, auth_client):
        StockTicker.objects.create(symbol="AAPL", name="Apple Inc.")
        StockTicker.objects.create(symbol="MSFT", name="Microsoft Corp.")

        response = auth_client.get(self.URL)
        assert response.status_code == 200
        symbols = sorted(t["symbol"] for t in response.data)
        assert symbols == ["AAPL", "MSFT"]

    def test_empty_list_when_none_seeded(self, auth_client):
        assert auth_client.get(self.URL).data == []
