"""Project-wide pytest fixtures for the QuantifeX backend.

Anything reused across test modules — auth helpers, yfinance mocks, factories —
lives here so individual tests stay short.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


# ---------------------------------------------------------------------------
# Database: use a fast in-memory SQLite for tests regardless of dev DB config.
# Override happens at collection time so Django's connection cache picks it up.
# ---------------------------------------------------------------------------

def pytest_configure(config):
    import django
    from django.conf import settings

    settings.DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
            "ATOMIC_REQUESTS": False,
            "AUTOCOMMIT": True,
            "TIME_ZONE": None,
            "CONN_MAX_AGE": 0,
            "CONN_HEALTH_CHECKS": False,
            "OPTIONS": {},
            "TEST": {
                "CHARSET": None,
                "COLLATION": None,
                "MIGRATE": True,
                "MIRROR": None,
                "NAME": None,
            },
        }
    }
    django.setup()


# ---------------------------------------------------------------------------
# Users & authenticated clients
# ---------------------------------------------------------------------------

@pytest.fixture
def make_user(db):
    """Factory: build a User with a sensible default password."""
    counter = {"n": 0}

    def _make(username: str | None = None, password: str = "testpass123!") -> User:
        counter["n"] += 1
        username = username or f"user{counter['n']}"
        return User.objects.create_user(username=username, password=password)

    return _make


@pytest.fixture
def user(make_user):
    return make_user()


@pytest.fixture
def other_user(make_user):
    return make_user()


@pytest.fixture
def api_client():
    """Unauthenticated DRF APIClient."""
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    """APIClient with `user` force-authenticated. Faster than JWT for non-auth tests."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def other_auth_client(user, other_user):
    """A second authenticated client used to check cross-user isolation."""
    client = APIClient()
    client.force_authenticate(user=other_user)
    return client


# ---------------------------------------------------------------------------
# yfinance mocking
# ---------------------------------------------------------------------------

def _price_series(days: int = 365, start_price: float = 100.0, drift: float = 0.0005,
                  vol: float = 0.02, seed: int = 42) -> pd.DataFrame:
    """Build a synthetic OHLCV DataFrame indexed by daily timestamps."""
    rng = np.random.default_rng(seed)
    rets = rng.normal(loc=drift, scale=vol, size=days)
    closes = start_price * np.exp(np.cumsum(rets))
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=days, freq="B")
    return pd.DataFrame({
        "Open": closes * (1 - 0.001),
        "High": closes * 1.01,
        "Low": closes * 0.99,
        "Close": closes,
        "Volume": rng.integers(1_000_000, 10_000_000, size=days),
    }, index=dates)


@pytest.fixture
def synthetic_history():
    """A 365-row daily price frame, deterministic. Useful in mocks."""
    return _price_series()


@pytest.fixture
def make_ticker_mock(synthetic_history):
    """Factory that builds a MagicMock matching `yfinance.Ticker(...)`'s surface.

    Override any kwarg to tweak the returned mock (e.g. `info=None` to simulate
    "ticker not found", `options=()` for "no options data").
    """
    def _make(*,
              info: dict | None = None,
              history_df: pd.DataFrame | None = None,
              options: tuple[str, ...] = ("2026-06-19",),
              calls_df: pd.DataFrame | None = None,
              puts_df: pd.DataFrame | None = None,
              earnings_history_df: pd.DataFrame | None = None,
              income_stmt_df: pd.DataFrame | None = None,
              quarterly_income_stmt_df: pd.DataFrame | None = None,
              calendar: dict | None = None):
        m = MagicMock()
        m.info = info if info is not None else {
            "shortName": "Test Co",
            "longName": "Test Company Inc.",
            "currentPrice": 150.0,
            "regularMarketPrice": 150.0,
            "regularMarketChange": 1.5,
            "regularMarketChangePercent": 1.0,
            "marketCap": 1_000_000_000,
            "trailingPE": 20.0,
            "dividendYield": 0.01,
            "fiftyTwoWeekHigh": 200.0,
            "fiftyTwoWeekLow": 100.0,
            "beta": 1.1,
            "forwardEps": 5.0,
            "revenueEstimate": 5_000_000_000,
        }
        m.history.return_value = history_df if history_df is not None else synthetic_history
        m.options = options

        def _chain(_exp):
            return SimpleNamespace(
                calls=calls_df if calls_df is not None else _default_chain_df(),
                puts=puts_df if puts_df is not None else _default_chain_df(),
            )

        m.option_chain.side_effect = _chain

        if earnings_history_df is None:
            earnings_history_df = pd.DataFrame({
                "epsActual": [1.20, 1.30, 1.40, 1.50],
                "epsEstimate": [1.10, 1.25, 1.35, 1.45],
            }, index=pd.to_datetime(["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31"]))
        m.earnings_history = earnings_history_df

        if income_stmt_df is None:
            income_stmt_df = pd.DataFrame(
                {pd.Timestamp("2024-12-31"): [1e9, 2e8],
                 pd.Timestamp("2023-12-31"): [9e8, 1.8e8]},
                index=["Total Revenue", "Net Income"],
            )
        m.income_stmt = income_stmt_df

        if quarterly_income_stmt_df is None:
            quarterly_income_stmt_df = pd.DataFrame(
                {pd.Timestamp("2025-12-31"): [3e8, 6e7],
                 pd.Timestamp("2025-09-30"): [2.8e8, 5.5e7]},
                index=["Total Revenue", "Net Income"],
            )
        m.quarterly_income_stmt = quarterly_income_stmt_df

        if calendar is None:
            calendar = {"Earnings Date": [datetime.now().date() + timedelta(days=30)]}
        m.calendar = calendar

        return m

    return _make


def _default_chain_df() -> pd.DataFrame:
    """Default options chain frame — six strikes spanning ATM."""
    strikes = [120, 135, 150, 165, 180, 195]
    return pd.DataFrame({
        "strike": strikes,
        "lastPrice": [32.0, 18.0, 7.5, 2.0, 0.6, 0.15],
        "bid": [31.5, 17.8, 7.3, 1.9, 0.55, 0.10],
        "ask": [32.5, 18.2, 7.7, 2.1, 0.65, 0.20],
        "change": [0.1] * 6,
        "percentChange": [0.5] * 6,
        "volume": [10, 25, 100, 80, 30, 5],
        "openInterest": [500, 1200, 5000, 4500, 1000, 200],
        "impliedVolatility": [0.30, 0.28, 0.25, 0.27, 0.32, 0.38],
        "inTheMoney": [True, True, False, False, False, False],
    })


@pytest.fixture
def patch_yfinance(make_ticker_mock, synthetic_history):
    """Patch `yfinance.Ticker` and `yfinance.download` everywhere they're imported.

    Yields a SimpleNamespace with `.ticker` (the default ticker mock) and
    `.download` so tests can tweak return values per-case.
    """
    ticker_mock = make_ticker_mock()

    multi_ticker_close = pd.DataFrame(
        {"AAPL": synthetic_history["Close"], "MSFT": synthetic_history["Close"] * 1.05},
        index=synthetic_history.index,
    )
    download_frame = pd.concat({"Close": multi_ticker_close}, axis=1)
    download_frame.columns = pd.MultiIndex.from_tuples(
        [("Close", "AAPL"), ("Close", "MSFT")]
    )

    targets = [
        "core.views.stock_detail.yf",
        "core.views.options_analysis.yf",
        "core.views.options_price.yf",
        "core.views.earnings_calendar.yf",
        "core.views.monte_carlo.yf",
        "backtesting.engine.simulation.yf",
        "backtesting.engine.volatility.yf",
    ]
    patches = []
    yf_mocks = []
    for t in targets:
        try:
            p = patch(t)
            mock = p.start()
            mock.Ticker.return_value = ticker_mock
            mock.download.return_value = download_frame
            patches.append(p)
            yf_mocks.append(mock)
        except (AttributeError, ModuleNotFoundError):
            pass

    yield SimpleNamespace(
        ticker=ticker_mock,
        download_frame=download_frame,
        yf_mocks=yf_mocks,
    )

    for p in patches:
        p.stop()
