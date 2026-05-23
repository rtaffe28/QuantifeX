"""Stock-detail endpoint — yfinance is mocked so tests are deterministic."""
import pytest


@pytest.mark.django_db
class TestStockDetail:
    URL = "/api/stock/AAPL/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_success_returns_full_payload(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        data = response.data
        assert data["symbol"] == "AAPL"
        assert data["name"] == "Test Co"
        assert data["current_price"] == 150.0
        assert data["price_history"], "price_history should not be empty"
        assert "earnings" in data
        assert "annual_financials" in data
        assert "quarterly_financials" in data
        assert "volatility" in data

    def test_price_history_uses_period_param(self, auth_client, patch_yfinance):
        auth_client.get(self.URL + "?period=3mo")
        # Verify yfinance Ticker.history was called with period="3mo"
        patch_yfinance.ticker.history.assert_called_with(period="3mo")

    def test_invalid_period_falls_back_to_default(self, auth_client, patch_yfinance):
        auth_client.get(self.URL + "?period=bogus")
        patch_yfinance.ticker.history.assert_called_with(period="1y")

    def test_volatility_present_with_enough_history(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL)
        vol = response.data["volatility"]
        assert vol["beta"] == 1.1
        assert vol["std_dev_30d"] is not None
        assert vol["std_dev_90d"] is not None

    def test_not_found_returns_404(self, auth_client, patch_yfinance):
        patch_yfinance.ticker.info = {}
        response = auth_client.get(self.URL)
        assert response.status_code == 404
        assert "error" in response.data

    def test_price_history_entries_have_expected_shape(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL)
        first = response.data["price_history"][0]
        assert set(first.keys()) == {"date", "close", "volume"}
        assert isinstance(first["close"], float)
        assert isinstance(first["volume"], int)
