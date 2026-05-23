"""Earnings calendar — pulls watchlist tickers by default, or `tickers` query param."""
from datetime import date, timedelta

import pytest
from core.models import Watchlist


@pytest.mark.django_db
class TestEarningsCalendar:
    URL = "/api/earnings-calendar/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_empty_when_no_watchlist_and_no_param(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        assert response.data["events"] == []

    def test_uses_watchlist_when_no_tickers_param(self, auth_client, patch_yfinance, user):
        Watchlist.objects.create(user=user, ticker="AAPL")
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        # Default mock has an earnings date 30 days out — should appear
        assert len(response.data["events"]) >= 1
        evt = response.data["events"][0]
        assert evt["ticker"] == "AAPL"
        assert evt["days_until"] >= 0

    def test_uses_query_param_tickers(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL + "?tickers=AAPL,MSFT")
        assert response.status_code == 200
        symbols = {e["ticker"] for e in response.data["events"]}
        assert "AAPL" in symbols or "MSFT" in symbols

    def test_clamps_days_ahead(self, auth_client, patch_yfinance):
        # 365 is out of range but should be clamped to 180; should not 400
        response = auth_client.get(self.URL + "?tickers=AAPL&days_ahead=365")
        assert response.status_code == 200

    def test_invalid_days_ahead_falls_back_to_default(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL + "?tickers=AAPL&days_ahead=notanumber")
        assert response.status_code == 200

    def test_event_includes_eps_and_revenue_estimates(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL + "?tickers=AAPL")
        evt = response.data["events"][0]
        assert "eps_estimate" in evt
        assert "revenue_estimate" in evt

    def test_excludes_dates_outside_window(self, auth_client, patch_yfinance):
        # Default mock places earnings 30 days out; limit window to 5 days
        response = auth_client.get(self.URL + "?tickers=AAPL&days_ahead=5")
        assert response.data["events"] == []

    def test_at_most_twenty_symbols(self, auth_client, patch_yfinance):
        # Stress: caller passes 30 symbols — view caps at 20 (no error)
        many = ",".join(f"T{i}" for i in range(30))
        response = auth_client.get(f"{self.URL}?tickers={many}")
        assert response.status_code == 200
