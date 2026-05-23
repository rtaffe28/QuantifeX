"""Black-Scholes math (engine.black_scholes) — used inside the simulation."""
import math
import pytest
from backtesting.engine.black_scholes import black_scholes_call, black_scholes_put


@pytest.mark.parametrize("S,K,sigma,r,t,expected", [
    (100, 100, 0.20, 0.05, 1.0, 10.4506),
    (100, 110, 0.20, 0.05, 1.0, 6.0401),
    (100, 90,  0.20, 0.05, 1.0, 16.6994),
])
def test_call_known_prices(S, K, sigma, r, t, expected):
    assert math.isclose(black_scholes_call(S, K, sigma, r, t), expected, abs_tol=0.005)


@pytest.mark.parametrize("S,K,sigma,r,t,expected", [
    (100, 100, 0.20, 0.05, 1.0, 5.5735),
    (100, 110, 0.20, 0.05, 1.0, 10.6753),
    (100, 90,  0.20, 0.05, 1.0, 2.3107),
])
def test_put_known_prices(S, K, sigma, r, t, expected):
    assert math.isclose(black_scholes_put(S, K, sigma, r, t), expected, abs_tol=0.005)


def test_put_call_parity():
    S, K, r, t = 100, 100, 0.05, 1.0
    sigma = 0.20
    c = black_scholes_call(S, K, sigma, r, t)
    p = black_scholes_put(S, K, sigma, r, t)
    assert math.isclose(c - p, S - K * math.exp(-r * t), abs_tol=0.001)


def test_zero_vol_call_collapses_to_intrinsic_discounted():
    """As sigma → 0, call price → max(0, S - K*exp(-rT))."""
    S, K, r, t = 110, 100, 0.05, 1.0
    expected = max(0, S - K * math.exp(-r * t))
    price = black_scholes_call(S, K, sigma=1e-6, r=r, t=t)
    assert math.isclose(price, expected, abs_tol=0.01)
