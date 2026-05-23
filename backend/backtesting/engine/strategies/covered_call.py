import pandas as pd
from datetime import timedelta
from ..black_scholes import black_scholes_call


def create_covered_call_strategy(ticker, strike_factor=1.06, interest_rate=0.05, time_to_expiration=15/365):
    """Factory: buy stock, then sell OTM calls against it for premium income."""
    days = int(time_to_expiration * 365)

    def covered_call_strategy(date, portfolio, market_data, actions):
        current_price = market_data['prices'][ticker]

        max_shares = int(portfolio.cash / current_price)
        if max_shares > 0:
            actions.buy_stock(portfolio, ticker, max_shares, current_price)

        if ticker in portfolio.positions and portfolio.positions[ticker].shares > 0:
            has_active_call = any(opt.ticker == ticker and opt.option_type == 'call'
                                  for opt in portfolio.options)

            if not has_active_call:
                shares = portfolio.positions[ticker].shares
                contracts = shares // 100

                if contracts > 0:
                    strike = current_price * strike_factor
                    expiration = date + timedelta(days=days)

                    if ticker in market_data['volatility']:
                        vol_data = market_data['volatility'][ticker]
                        if len(vol_data) > 0:
                            vol = vol_data.iloc[-1, 0]

                            if not pd.isna(vol):
                                premium = black_scholes_call(
                                    S=current_price,
                                    K=strike,
                                    sigma=vol,
                                    r=interest_rate,
                                    t=time_to_expiration,
                                )

                                actions.sell_call(
                                    portfolio=portfolio,
                                    ticker=ticker,
                                    strike=strike,
                                    expiration=expiration,
                                    contracts=contracts,
                                    premium=premium,
                                )

    return covered_call_strategy
