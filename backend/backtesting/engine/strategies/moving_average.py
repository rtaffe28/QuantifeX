import pandas as pd


def create_sma_crossover_strategy(
    ticker,
    short_window=50,
    long_window=200,
    allocation=1.0,
):
    """Factory: SMA crossover.
    BUY on Golden Cross (short crosses above long), SELL on Death Cross.
    """

    state = {
        'prev_short_ma': None,
        'prev_long_ma': None,
        'position_entered': False,
    }

    def sma_crossover(date, portfolio, market_data, actions):
        current_price = float(market_data['prices'][ticker])

        if ticker not in market_data['data']:
            return

        hist_data = market_data['data'][ticker]

        if len(hist_data) < long_window:
            return

        prices = hist_data['Close']
        short_ma = float(prices.rolling(window=short_window).mean().iloc[-1])
        long_ma = float(prices.rolling(window=long_window).mean().iloc[-1])

        if pd.isna(short_ma) or pd.isna(long_ma):
            return

        if state['prev_short_ma'] is not None and state['prev_long_ma'] is not None:

            if (state['prev_short_ma'] <= state['prev_long_ma'] and
                short_ma > long_ma and
                not state['position_entered']):

                available_cash = portfolio.cash * allocation
                max_shares = int(available_cash / current_price)

                if max_shares > 0:
                    actions.buy_stock(portfolio, ticker, max_shares, current_price)
                    state['position_entered'] = True

            elif (state['prev_short_ma'] >= state['prev_long_ma'] and
                  short_ma < long_ma and
                  state['position_entered']):

                if ticker in portfolio.positions and portfolio.positions[ticker].shares > 0:
                    shares = portfolio.positions[ticker].shares
                    actions.sell_stock(portfolio, ticker, shares, current_price)
                    state['position_entered'] = False

        state['prev_short_ma'] = short_ma
        state['prev_long_ma'] = long_ma

    return sma_crossover
