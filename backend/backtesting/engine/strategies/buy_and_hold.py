def create_buy_and_hold_strategy(ticker):
    """Factory: buy with all cash on first opportunity, hold to end."""

    def buy_and_hold(date, portfolio, market_data, actions):
        current_price = market_data['prices'][ticker]

        if ticker not in portfolio.positions or portfolio.positions[ticker].shares == 0:
            max_shares = int(portfolio.cash / current_price)
            if max_shares > 0:
                actions.buy_stock(portfolio, ticker, max_shares, current_price)

    return buy_and_hold
