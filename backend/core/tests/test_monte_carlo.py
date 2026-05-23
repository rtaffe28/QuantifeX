"""Monte Carlo simulation endpoint.

Validation is exercised heavily because it doesn't depend on yfinance. The
successful-run case is covered separately with a yfinance mock.
"""
import numpy as np
import pandas as pd
import pytest


VALID_PAYLOAD = {
    "holdings": [
        {"ticker": "AAPL", "weight": 0.6},
        {"ticker": "MSFT", "weight": 0.4},
    ],
    "initial_value": 10000,
    "monthly_contribution": 100,
    "years": 5,
    "simulations": 200,
    "historical_period": "10y",
    "risk_free_rate": 0.05,
}


@pytest.mark.django_db
class TestMonteCarloValidation:
    URL = "/api/monte-carlo/simulate/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.post(self.URL, VALID_PAYLOAD, format="json").status_code == 401

    def test_empty_holdings_rejected(self, auth_client):
        payload = {**VALID_PAYLOAD, "holdings": []}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "holdings" in response.data

    def test_too_many_holdings_rejected(self, auth_client):
        payload = {**VALID_PAYLOAD, "holdings": [{"ticker": f"T{i}", "weight": 1 / 16} for i in range(16)]}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "holdings" in response.data

    def test_weights_must_sum_to_one(self, auth_client):
        payload = {**VALID_PAYLOAD, "holdings": [{"ticker": "AAPL", "weight": 0.3}, {"ticker": "MSFT", "weight": 0.4}]}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "weights" in response.data

    def test_initial_value_must_be_positive(self, auth_client):
        payload = {**VALID_PAYLOAD, "initial_value": 0}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "initial_value" in response.data

    @pytest.mark.parametrize("years", [0, 51])
    def test_years_out_of_range(self, auth_client, years):
        payload = {**VALID_PAYLOAD, "years": years}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "years" in response.data

    @pytest.mark.parametrize("sims", [99, 5001])
    def test_simulations_out_of_range(self, auth_client, sims):
        payload = {**VALID_PAYLOAD, "simulations": sims}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "simulations" in response.data

    def test_bad_historical_period_rejected(self, auth_client):
        payload = {**VALID_PAYLOAD, "historical_period": "20y"}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "historical_period" in response.data


@pytest.mark.django_db
class TestMonteCarloSimulation:
    URL = "/api/monte-carlo/simulate/"

    def test_successful_simulation(self, auth_client, patch_yfinance, synthetic_history):
        # Build a tidy multi-ticker frame that the view's `raw["Close"]` indexing handles.
        closes = pd.DataFrame({
            "AAPL": synthetic_history["Close"].values,
            "MSFT": synthetic_history["Close"].values * 1.05,
        }, index=synthetic_history.index)
        frame = pd.concat({"Close": closes}, axis=1)
        for m in patch_yfinance.yf_mocks:
            m.download.return_value = frame

        response = auth_client.post(self.URL, VALID_PAYLOAD, format="json")
        assert response.status_code == 200, response.data
        d = response.data
        assert d["years"] == 5
        assert d["initial_value"] == 10000
        for key in ("p10", "p25", "p50", "p75", "p90"):
            assert key in d["percentiles"]
            assert len(d["percentiles"][key]) == 6  # years + 1
        for stat in ("median_final", "mean_final", "prob_double", "prob_loss",
                     "expected_annual_return", "portfolio_volatility"):
            assert stat in d["stats"]
        assert d["time_labels"] == [f"Year {i}" for i in range(6)]

    def test_insufficient_history_returns_400(self, auth_client, patch_yfinance, synthetic_history):
        short = synthetic_history.iloc[:100]  # < 252 trading days
        closes = pd.DataFrame({
            "AAPL": short["Close"].values,
            "MSFT": short["Close"].values * 1.05,
        }, index=short.index)
        frame = pd.concat({"Close": closes}, axis=1)
        for m in patch_yfinance.yf_mocks:
            m.download.return_value = frame

        response = auth_client.post(self.URL, VALID_PAYLOAD, format="json")
        assert response.status_code == 400
        assert "Insufficient historical data" in response.data["error"]
