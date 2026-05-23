import pandas as pd
from datetime import timedelta
from ..black_scholes import black_scholes_call, black_scholes_put


def create_wheel_strategy(
    ticker,
    put_strike_factor=0.95,
    call_strike_factor=1.05,
    days_to_expiration=30,
    interest_rate=0.05,
    min_premium_threshold=0.01,
):
    """Factory: the wheel — sell CSPs while flat, sell covered calls once assigned."""
    time = days_to_expiration / 365

    def wheel_strategy(date, portfolio, market_data, actions):
        current_price = market_data['prices'][ticker]

        has_stock = ticker in portfolio.positions and portfolio.positions[ticker].shares > 0
        has_active_put = any(
            opt.ticker == ticker and
            opt.option_type == 'put' and
            opt.position == 'short'
            for opt in portfolio.options
        )
        has_active_call = any(
            opt.ticker == ticker and
            opt.option_type == 'call' and
            opt.position == 'short'
            for opt in portfolio.options
        )

        vol = None
        if ticker in market_data['volatility']:
            vol_data = market_data['volatility'][ticker]
            if len(vol_data) > 0:
                vol = vol_data.iloc[-1, 0]
                if pd.isna(vol):
                    vol = None

        if vol is None:
            return

        if not has_stock and not has_active_put:
            put_strike = current_price * put_strike_factor

            cash_per_contract = put_strike * 100
            max_contracts = int(portfolio.cash / cash_per_contract)

            if max_contracts > 0:
                expiration = date + timedelta(days=days_to_expiration)

                put_premium = black_scholes_put(
                    S=current_price,
                    K=put_strike,
                    sigma=vol,
                    r=interest_rate,
                    t=time,
                )

                if put_premium / current_price >= min_premium_threshold:
                    actions.sell_put(
                        portfolio=portfolio,
                        ticker=ticker,
                        strike=put_strike,
                        expiration=expiration,
                        contracts=max_contracts,
                        premium=put_premium,
                    )

        elif has_stock and not has_active_call:
            shares = portfolio.positions[ticker].shares
            contracts = shares // 100

            if contracts > 0:
                call_strike = current_price * call_strike_factor
                expiration = date + timedelta(days=days_to_expiration)

                call_premium = black_scholes_call(
                    S=current_price,
                    K=call_strike,
                    sigma=vol,
                    r=interest_rate,
                    t=time,
                )

                if call_premium / current_price >= min_premium_threshold:
                    actions.sell_call(
                        portfolio=portfolio,
                        ticker=ticker,
                        strike=call_strike,
                        expiration=expiration,
                        contracts=contracts,
                        premium=call_premium,
                    )

    return wheel_strategy
