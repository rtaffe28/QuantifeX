"""Strategy registry + Strategy._validate parameter coercion/bounds."""
import pytest

from backtesting.engine.base import ParamSpec, Strategy
from backtesting.engine.registry import all_slugs, all_strategies, get_strategy, register


def test_all_strategies_includes_buy_and_hold():
    schemas = all_strategies()
    slugs = {s["id"] for s in schemas}
    # All five strategies that ship today should be registered
    assert {"buy_and_hold", "sma_crossover", "covered_call", "leap", "wheel"} <= slugs


def test_all_slugs_matches_all_strategies():
    assert all_slugs() == {s["id"] for s in all_strategies()}


def test_get_strategy_returns_class():
    cls = get_strategy("buy_and_hold")
    assert issubclass(cls, Strategy)
    assert cls.slug == "buy_and_hold"


def test_get_unknown_strategy_raises():
    with pytest.raises(KeyError):
        get_strategy("does_not_exist")


def test_register_without_slug_raises():
    class _NoSlug(Strategy):
        pass
    with pytest.raises(ValueError):
        register(_NoSlug)


class TestParamValidation:
    """Strategy._validate handles coercion and min/max bounds for params."""

    class _ToyStrategy(Strategy):
        slug = "_toy_for_test"
        name = "Toy"
        parameters = [
            ParamSpec("window", "Window", "integer", 10, min=1, max=200),
            ParamSpec("alpha", "Alpha", "number", 0.5, min=0.0, max=1.0),
            ParamSpec("mode", "Mode", "string", "default"),
        ]

        def step(self, ctx):
            pass

    def test_defaults_used_when_missing(self):
        s = self._ToyStrategy("AAPL", {})
        assert s.params == {"window": 10, "alpha": 0.5, "mode": "default"}

    def test_types_coerced(self):
        s = self._ToyStrategy("AAPL", {"window": "20", "alpha": "0.3", "mode": 42})
        assert s.params == {"window": 20, "alpha": 0.3, "mode": "42"}

    def test_below_min_rejected(self):
        with pytest.raises(ValueError, match="window must be >= 1"):
            self._ToyStrategy("AAPL", {"window": 0})

    def test_above_max_rejected(self):
        with pytest.raises(ValueError, match="alpha must be <= 1"):
            self._ToyStrategy("AAPL", {"alpha": 1.5})

    def test_schema_serializes_params(self):
        schema = self._ToyStrategy.schema()
        assert schema["id"] == "_toy_for_test"
        keys = {p["key"] for p in schema["parameters"]}
        assert keys == {"window", "alpha", "mode"}

    def test_strategy_missing_slug_raises_at_init(self):
        class NoSlug(Strategy):
            slug = ""

            def step(self, ctx):
                pass

        with pytest.raises(TypeError):
            NoSlug("AAPL")
