from datetime import timedelta

import pandas as pd

from ..base import ParamSpec, Strategy, StepContext
from ..black_scholes import black_scholes_call, black_scholes_put
from ..registry import register


@register
class Wheel(Strategy):
    slug = "wheel"
    name = "Wheel Strategy"
    description = "Sells cash-secured puts, then transitions to covered calls on assignment."
    parameters = [
        ParamSpec("put_strike_factor", "Put Strike Factor (e.g. 0.95 = 5% OTM)", "number", 0.95, max=1.0),
        ParamSpec("call_strike_factor", "Call Strike Factor (e.g. 1.05 = 5% OTM)", "number", 1.05, min=1.0),
        ParamSpec("days_to_expiration", "Days to Expiration", "integer", 30, min=1),
        ParamSpec("interest_rate", "Risk-Free Rate", "number", 0.05, min=0.0),
        ParamSpec("min_premium_threshold", "Min Premium / Price", "number", 0.01, min=0.0),
    ]

    def step(self, ctx: StepContext) -> None:
        put_strike_factor = self.params["put_strike_factor"]
        call_strike_factor = self.params["call_strike_factor"]
        dte = self.params["days_to_expiration"]
        interest_rate = self.params["interest_rate"]
        min_premium = self.params["min_premium_threshold"]
        time = dte / 365

        price = ctx.market_data["prices"][self.ticker]
        vol = _current_vol(ctx, self.ticker)
        if vol is None:
            return

        pos = ctx.portfolio.positions.get(self.ticker)
        has_stock = pos is not None and pos.shares > 0
        has_active_put = any(
            opt.ticker == self.ticker and opt.option_type == "put" and opt.position == "short"
            for opt in ctx.portfolio.options
        )
        has_active_call = any(
            opt.ticker == self.ticker and opt.option_type == "call" and opt.position == "short"
            for opt in ctx.portfolio.options
        )

        if not has_stock and not has_active_put:
            put_strike = price * put_strike_factor
            max_contracts = int(ctx.portfolio.cash / (put_strike * 100))
            if max_contracts == 0:
                return
            premium = black_scholes_put(S=price, K=put_strike, sigma=vol, r=interest_rate, t=time)
            if premium / price < min_premium:
                return
            ctx.actions.sell_put(
                portfolio=ctx.portfolio, ticker=self.ticker, strike=put_strike,
                expiration=ctx.date + timedelta(days=dte), contracts=max_contracts, premium=premium,
            )

        elif has_stock and not has_active_call:
            contracts = pos.shares // 100
            if contracts == 0:
                return
            call_strike = price * call_strike_factor
            premium = black_scholes_call(S=price, K=call_strike, sigma=vol, r=interest_rate, t=time)
            if premium / price < min_premium:
                return
            ctx.actions.sell_call(
                portfolio=ctx.portfolio, ticker=self.ticker, strike=call_strike,
                expiration=ctx.date + timedelta(days=dte), contracts=contracts, premium=premium,
            )


def _current_vol(ctx: StepContext, ticker: str) -> float | None:
    if ticker not in ctx.market_data["volatility"]:
        return None
    vol_data = ctx.market_data["volatility"][ticker]
    if len(vol_data) == 0:
        return None
    vol = vol_data.iloc[-1, 0]
    return None if pd.isna(vol) else float(vol)
