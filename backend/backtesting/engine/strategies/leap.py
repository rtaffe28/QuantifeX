from datetime import timedelta

import pandas as pd

from ..base import ParamSpec, Strategy, StepContext
from ..black_scholes import black_scholes_call
from ..registry import register


@register
class Leap(Strategy):
    slug = "leap"
    name = "LEAP Strategy"
    description = "Buys long-dated call options as a leveraged equity substitute."
    parameters = [
        ParamSpec("strike_factor", "Strike Factor (e.g. 1.1 = 10% OTM)", "number", 1.1),
        ParamSpec("days", "Days to Expiry", "integer", 365, min=30),
        ParamSpec("interest_rate", "Risk-Free Rate", "number", 0.05, min=0.0),
        ParamSpec("roll_threshold", "Roll Threshold (days)", "integer", 90, min=1),
    ]

    def step(self, ctx: StepContext) -> None:
        strike_factor = self.params["strike_factor"]
        days = self.params["days"]
        interest_rate = self.params["interest_rate"]
        roll_threshold = self.params["roll_threshold"]
        time = days / 365

        price = ctx.market_data["prices"][self.ticker]
        vol = _current_vol(ctx, self.ticker)
        if vol is None:
            return

        has_active_leap = any(
            opt.ticker == self.ticker and opt.option_type == "call" and opt.position == "long"
            for opt in ctx.portfolio.options
        )

        if not has_active_leap and ctx.portfolio.cash > 1000:
            strike = price * strike_factor
            expiration = ctx.date + timedelta(days=days)
            premium = black_scholes_call(S=price, K=strike, sigma=vol, r=interest_rate, t=time)
            max_contracts = int(ctx.portfolio.cash / (premium * 100))
            if max_contracts > 0:
                ctx.actions.buy_call(
                    portfolio=ctx.portfolio, ticker=self.ticker, strike=strike,
                    expiration=expiration, contracts=max_contracts, premium=premium,
                )

        for opt in ctx.portfolio.options:
            if not (opt.ticker == self.ticker and opt.option_type == "call" and opt.position == "long"):
                continue
            days_left = (opt.expiration_date - ctx.date).days
            if not (0 < days_left < roll_threshold):
                continue

            close_premium = black_scholes_call(
                S=price, K=opt.strike, sigma=vol, r=interest_rate, t=days_left / 365,
            )
            ctx.actions.close_call(
                portfolio=ctx.portfolio, ticker=self.ticker, strike=opt.strike,
                expiration=opt.expiration_date, contracts=opt.contracts, premium=close_premium,
            )

            new_strike = price * strike_factor
            new_expiration = ctx.date + timedelta(days=days)
            new_premium = black_scholes_call(
                S=price, K=new_strike, sigma=vol, r=interest_rate, t=time,
            )
            max_new = int(ctx.portfolio.cash / (new_premium * 100))
            if max_new > 0:
                ctx.actions.buy_call(
                    portfolio=ctx.portfolio, ticker=self.ticker, strike=new_strike,
                    expiration=new_expiration, contracts=max_new, premium=new_premium,
                )
            break  # roll one position per step


def _current_vol(ctx: StepContext, ticker: str) -> float | None:
    if ticker not in ctx.market_data["volatility"]:
        return None
    vol_data = ctx.market_data["volatility"][ticker]
    if len(vol_data) == 0:
        return None
    vol = vol_data.iloc[-1, 0]
    return None if pd.isna(vol) else float(vol)
