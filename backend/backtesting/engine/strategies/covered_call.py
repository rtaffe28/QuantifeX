from datetime import timedelta

import pandas as pd

from ..base import ParamSpec, Strategy, StepContext
from ..black_scholes import black_scholes_call
from ..registry import register


@register
class CoveredCall(Strategy):
    slug = "covered_call"
    name = "Covered Call"
    description = "Buys stock then sells OTM call options to generate premium income."
    parameters = [
        ParamSpec("strike_factor", "Strike Factor (e.g. 1.06 = 6% OTM)", "number", 1.06, min=1.0),
        ParamSpec("interest_rate", "Risk-Free Rate", "number", 0.05, min=0.0),
        ParamSpec("days_to_expiration", "Days to Expiration", "integer", 15, min=1),
    ]

    def step(self, ctx: StepContext) -> None:
        strike_factor = self.params["strike_factor"]
        interest_rate = self.params["interest_rate"]
        days = self.params["days_to_expiration"]
        time_to_expiration = days / 365

        price = ctx.market_data["prices"][self.ticker]

        max_shares = int(ctx.portfolio.cash / price)
        if max_shares > 0:
            ctx.actions.buy_stock(ctx.portfolio, self.ticker, max_shares, price)

        pos = ctx.portfolio.positions.get(self.ticker)
        if not pos or pos.shares == 0:
            return

        has_active_call = any(
            opt.ticker == self.ticker and opt.option_type == "call"
            for opt in ctx.portfolio.options
        )
        if has_active_call:
            return

        contracts = pos.shares // 100
        if contracts == 0:
            return

        vol = _current_vol(ctx, self.ticker)
        if vol is None:
            return

        strike = price * strike_factor
        expiration = ctx.date + timedelta(days=days)
        premium = black_scholes_call(S=price, K=strike, sigma=vol, r=interest_rate, t=time_to_expiration)

        ctx.actions.sell_call(
            portfolio=ctx.portfolio,
            ticker=self.ticker,
            strike=strike,
            expiration=expiration,
            contracts=contracts,
            premium=premium,
        )


def _current_vol(ctx: StepContext, ticker: str) -> float | None:
    if ticker not in ctx.market_data["volatility"]:
        return None
    vol_data = ctx.market_data["volatility"][ticker]
    if len(vol_data) == 0:
        return None
    vol = vol_data.iloc[-1, 0]
    return None if pd.isna(vol) else float(vol)
