from ..base import Strategy, StepContext
from ..registry import register


@register
class BuyAndHold(Strategy):
    slug = "buy_and_hold"
    name = "Buy & Hold"
    description = "Buys the stock on the first trading day and holds until the end date."
    parameters = []

    def step(self, ctx: StepContext) -> None:
        price = ctx.market_data["prices"][self.ticker]

        existing = ctx.portfolio.positions.get(self.ticker)
        if existing is None or existing.shares == 0:
            shares = int(ctx.portfolio.cash / price)
            if shares > 0:
                ctx.actions.buy_stock(ctx.portfolio, self.ticker, shares, price)
