"""Black-Scholes options pricer endpoint.

Reference values were computed with `scipy.stats.norm` against the same formulas
used in the view, so they pin the math rather than re-derive it. Sanity is
established with put-call parity and ITM/OTM behaviour.
"""
import math
import pytest


# A canonical ATM-ish input set used across several tests.
ATM = {
    "spot": 100,
    "strike": 100,
    "expiry_days": 365,
    "iv": 0.20,
    "rate": 0.05,
}


@pytest.mark.django_db
class TestOptionsPriceValidation:
    URL = "/api/options/price/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_missing_option_type_rejected(self, auth_client):
        response = auth_client.get(self.URL, ATM)
        assert response.status_code == 400
        assert "option_type" in response.data

    def test_bad_option_type_rejected(self, auth_client):
        response = auth_client.get(self.URL, {**ATM, "option_type": "binary"})
        assert response.status_code == 400

    @pytest.mark.parametrize("field,bad_value", [
        ("spot", 0),
        ("spot", -1),
        ("strike", 0),
        ("expiry_days", 0),
        ("iv", 0),
        ("rate", -0.01),
    ])
    def test_bad_numeric_inputs_rejected(self, auth_client, field, bad_value):
        params = {**ATM, "option_type": "call", field: bad_value}
        response = auth_client.get(self.URL, params)
        assert response.status_code == 400
        assert field in response.data

    def test_non_numeric_raises_400(self, auth_client):
        response = auth_client.get(self.URL, {**ATM, "spot": "abc", "option_type": "call"})
        assert response.status_code == 400


@pytest.mark.django_db
class TestOptionsPriceMath:
    URL = "/api/options/price/"

    def test_atm_call_price_known(self, auth_client):
        """ATM call: spot=100, K=100, T=1y, sigma=20%, r=5% -> ≈ 10.4506."""
        response = auth_client.get(self.URL, {**ATM, "option_type": "call"})
        assert response.status_code == 200
        assert math.isclose(response.data["price"], 10.4506, abs_tol=0.005)

    def test_atm_put_price_known(self, auth_client):
        """ATM put under the same params: ≈ 5.5735."""
        response = auth_client.get(self.URL, {**ATM, "option_type": "put"})
        assert math.isclose(response.data["price"], 5.5735, abs_tol=0.005)

    def test_put_call_parity_holds(self, auth_client):
        """C - P = S - K*exp(-rT). Tight tolerance."""
        call = auth_client.get(self.URL, {**ATM, "option_type": "call"}).data
        put = auth_client.get(self.URL, {**ATM, "option_type": "put"}).data
        S, K, r, T = ATM["spot"], ATM["strike"], ATM["rate"], ATM["expiry_days"] / 365.0
        expected = S - K * math.exp(-r * T)
        assert math.isclose(call["price"] - put["price"], expected, abs_tol=0.01)

    def test_deep_itm_call_intrinsic_only(self, auth_client):
        """Deep ITM short-dated call ≈ intrinsic value."""
        response = auth_client.get(self.URL, {
            "spot": 200, "strike": 100, "expiry_days": 1, "iv": 0.20, "rate": 0.05,
            "option_type": "call",
        })
        assert response.data["intrinsic_value"] == 100.0
        # Time value should be tiny for 1-day deep-ITM call
        assert response.data["time_value"] < 0.1

    def test_deep_otm_put_intrinsic_zero(self, auth_client):
        response = auth_client.get(self.URL, {
            "spot": 200, "strike": 100, "expiry_days": 30, "iv": 0.20, "rate": 0.05,
            "option_type": "put",
        })
        assert response.data["intrinsic_value"] == 0.0

    def test_call_delta_in_range(self, auth_client):
        d = auth_client.get(self.URL, {**ATM, "option_type": "call"}).data["delta"]
        assert 0 < d < 1

    def test_put_delta_in_range(self, auth_client):
        d = auth_client.get(self.URL, {**ATM, "option_type": "put"}).data["delta"]
        assert -1 < d < 0

    def test_gamma_positive(self, auth_client):
        for opt in ("call", "put"):
            g = auth_client.get(self.URL, {**ATM, "option_type": opt}).data["gamma"]
            assert g > 0

    def test_vega_positive(self, auth_client):
        for opt in ("call", "put"):
            v = auth_client.get(self.URL, {**ATM, "option_type": opt}).data["vega"]
            assert v > 0

    def test_call_theta_negative(self, auth_client):
        # Generally negative for long calls.
        assert auth_client.get(self.URL, {**ATM, "option_type": "call"}).data["theta"] < 0

    def test_response_shape(self, auth_client):
        data = auth_client.get(self.URL, {**ATM, "option_type": "call"}).data
        assert set(data.keys()) == {
            "price", "delta", "gamma", "theta", "vega", "rho",
            "intrinsic_value", "time_value", "breakeven",
        }


@pytest.mark.django_db
class TestOptionsPriceAutofill:
    URL = "/api/options/price/"

    def test_spot_and_iv_filled_from_symbol(self, auth_client, patch_yfinance):
        """When symbol is given but spot/iv are missing, view pulls from yfinance."""
        params = {
            "option_type": "call",
            "strike": 150,
            "expiry_days": 30,
            "rate": 0.05,
            "symbol": "AAPL",
        }
        response = auth_client.get(self.URL, params)
        assert response.status_code == 200
        assert response.data["price"] >= 0
        # yfinance.Ticker was queried for AAPL
        patch_yfinance.ticker.history.assert_called_with(period="1y")
