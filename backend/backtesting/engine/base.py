from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from .portfolio import Portfolio
from .trading_actions import TradingAction


ParamType = Literal["number", "integer", "string"]


@dataclass(frozen=True)
class ParamSpec:
    """A single tunable parameter on a Strategy.

    `type` controls coercion: `integer` -> int(), `number` -> float(), `string` -> str().
    The default is also the value rendered in the frontend form.
    """
    key: str
    label: str
    type: ParamType
    default: Any
    min: float | None = None
    max: float | None = None

    def serialize(self) -> dict:
        d = {"key": self.key, "label": self.label, "type": self.type, "default": self.default}
        if self.min is not None:
            d["min"] = self.min
        if self.max is not None:
            d["max"] = self.max
        return d


@dataclass
class StepContext:
    """Everything a Strategy.step() needs for a single trading day."""
    date: datetime
    portfolio: Portfolio
    market_data: dict
    actions: type[TradingAction]
    ticker: str


class Strategy:
    """Base class for backtesting strategies.

    Subclasses declare class-level metadata and a `step()` method. The
    framework instantiates the strategy once per backtest run with validated
    params, then calls step() on each trading day.
    """

    slug: str = ""
    name: str = ""
    description: str = ""
    parameters: list[ParamSpec] = []

    def __init__(self, ticker: str, raw_params: dict | None = None):
        if not self.slug:
            raise TypeError(f"{type(self).__name__} must set `slug`")
        self.ticker = ticker.upper()
        self.params = self._validate(raw_params or {})
        self.state: dict = {}

    @classmethod
    def _validate(cls, raw: dict) -> dict:
        out: dict = {}
        for spec in cls.parameters:
            val = raw.get(spec.key, spec.default)
            if spec.type == "integer":
                val = int(val)
            elif spec.type == "number":
                val = float(val)
            elif spec.type == "string":
                val = str(val)
            if spec.min is not None and val < spec.min:
                raise ValueError(f"{spec.key} must be >= {spec.min}, got {val}")
            if spec.max is not None and val > spec.max:
                raise ValueError(f"{spec.key} must be <= {spec.max}, got {val}")
            out[spec.key] = val
        return out

    def step(self, ctx: StepContext) -> None:
        raise NotImplementedError

    @classmethod
    def schema(cls) -> dict:
        return {
            "id": cls.slug,
            "name": cls.name,
            "description": cls.description,
            "parameters": [p.serialize() for p in cls.parameters],
        }
