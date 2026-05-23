import pandas as pd

from ..base import ParamSpec, Strategy, StepContext
from ..registry import register


@register
class SmaCrossover(Strategy):
    slug = "sma_crossover"
    name = "SMA Crossover"
    description = "Buys on a golden cross (short SMA above long SMA) and sells on a death cross."
    parameters = [
        ParamSpec("short_window", "Short Window (days)", "integer", 50, min=1),
        ParamSpec("long_window", "Long Window (days)", "integer", 200, min=2),
        ParamSpec("allocation", "Allocation (0-1)", "number", 1.0, min=0.0, max=1.0),
    ]

    def step(self, ctx: StepContext) -> None:
        short_window = self.params["short_window"]
        long_window = self.params["long_window"]
        allocation = self.params["allocation"]

        if self.ticker not in ctx.market_data["data"]:
            return

        hist_data = ctx.market_data["data"][self.ticker]
        if len(hist_data) < long_window:
            return

        prices = hist_data["Close"]
        short_ma = float(prices.rolling(window=short_window).mean().iloc[-1])
        long_ma = float(prices.rolling(window=long_window).mean().iloc[-1])

        if pd.isna(short_ma) or pd.isna(long_ma):
            return

        current_price = float(ctx.market_data["prices"][self.ticker])
        prev_short = self.state.get("prev_short")
        prev_long = self.state.get("prev_long")
        entered = self.state.get("entered", False)

        if prev_short is not None and prev_long is not None:
            golden = prev_short <= prev_long and short_ma > long_ma
            death = prev_short >= prev_long and short_ma < long_ma

            if golden and not entered:
                shares = int((ctx.portfolio.cash * allocation) / current_price)
                if shares > 0:
                    ctx.actions.buy_stock(ctx.portfolio, self.ticker, shares, current_price)
                    self.state["entered"] = True

            elif death and entered:
                pos = ctx.portfolio.positions.get(self.ticker)
                if pos and pos.shares > 0:
                    ctx.actions.sell_stock(ctx.portfolio, self.ticker, pos.shares, current_price)
                    self.state["entered"] = False

        self.state["prev_short"] = short_ma
        self.state["prev_long"] = long_ma
