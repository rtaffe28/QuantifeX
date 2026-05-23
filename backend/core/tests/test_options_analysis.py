"""Options chain analysis endpoint — yfinance mocked."""
import pandas as pd
import pytest


@pytest.mark.django_db
class TestOptionsAnalysis:
    URL = "/api/options/AAPL/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_success_full_payload(self, auth_client, patch_yfinance):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        d = response.data
        assert d["symbol"] == "AAPL"
        assert d["name"] == "Test Co"
        assert d["current_price"] == 150.0
        assert d["calls"] and d["puts"]
        assert d["expirations"]
        assert d["selected_expiration"] in d["expirations"]
        assert "summary" in d and "iv_skew" in d
        assert d["summary"]["total_call_volume"] >= 0

    def test_ticker_not_found(self, auth_client, patch_yfinance):
        patch_yfinance.ticker.info = {}
        response = auth_client.get(self.URL)
        assert response.status_code == 404

    def test_no_options_returns_404(self, auth_client, patch_yfinance):
        patch_yfinance.ticker.options = ()
        response = auth_client.get(self.URL)
        assert response.status_code == 404

    def test_summary_pc_ratios_computed(self, auth_client, patch_yfinance):
        d = auth_client.get(self.URL).data
        s = d["summary"]
        assert s["pc_volume_ratio"] is not None
        assert s["pc_oi_ratio"] is not None

    def test_max_pain_returned(self, auth_client, patch_yfinance):
        d = auth_client.get(self.URL).data
        assert d["summary"]["max_pain"] in [120, 135, 150, 165, 180, 195]

    def test_expiration_param_passed_through(self, auth_client, patch_yfinance):
        # Mock has one expiration; selecting a bogus one falls back to that one.
        d = auth_client.get(self.URL + "?expiration=2099-01-01").data
        assert d["selected_expiration"] == patch_yfinance.ticker.options[0]

    def test_volume_oi_by_strike_shape(self, auth_client, patch_yfinance):
        d = auth_client.get(self.URL).data
        entry = d["volume_oi_by_strike"][0]
        assert set(entry.keys()) == {"strike", "callVolume", "callOI", "putVolume", "putOI"}
