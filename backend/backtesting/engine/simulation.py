import pandas as pd
import numpy as np
from datetime import datetime
from typing import Callable, Dict, List, Optional
import yfinance as yf

from .portfolio import Portfolio, Position, OptionContract
from .trading_actions import TradingAction


class BacktestSimulation:

    def __init__(self,
                 tickers: List[str],
                 start_date: datetime,
                 end_date: datetime,
                 initial_cash: float,
                 strategy_callback: Callable):

        self.tickers = tickers
        self.start_date = start_date
        self.end_date = end_date
        self.initial_cash = initial_cash
        self.strategy_callback = strategy_callback

        self.portfolio = Portfolio(cash=initial_cash)
        self.history: List[Dict] = []
        self.market_data: Dict[str, pd.DataFrame] = {}
        self.volatility_data: Dict[str, pd.DataFrame] = {}
        self.transactions: List[Dict] = []

    def load_market_data(self):
        from .volatility import historical_volatility

        for ticker in self.tickers:
            df = yf.download(ticker, start=self.start_date, end=self.end_date, progress=False)
            self.market_data[ticker] = df
            vol_df = historical_volatility(ticker, self.start_date, self.end_date)

            if df.index.tz is not None and vol_df.index.tz is None:
                vol_df.index = vol_df.index.tz_localize(df.index.tz)
            elif df.index.tz is None and vol_df.index.tz is not None:
                vol_df.index = vol_df.index.tz_localize(None)

            self.volatility_data[ticker] = vol_df

    def _get_current_prices(self, date: datetime) -> Dict[str, float]:
        prices = {}
        for ticker, df in self.market_data.items():
            try:
                if date in df.index:
                    price = df.loc[date, 'Close']
                    if isinstance(price, pd.Series):
                        prices[ticker] = float(price.iloc[0])
                    else:
                        prices[ticker] = float(price)
                else:
                    prior_data = df[df.index <= date]
                    if len(prior_data) > 0:
                        prices[ticker] = float(prior_data['Close'].iloc[-1])
            except Exception:
                prices[ticker] = 0.0
        return prices

    def _handle_option_expirations(self, current_date: datetime, current_prices: Dict[str, float]):
        expired_options = []

        for i, opt in enumerate(self.portfolio.options):
            if current_date >= opt.expiration_date:
                expired_options.append(i)

                current_price = current_prices.get(opt.ticker, 0)

                if opt.option_type == 'call' and opt.position == 'short':
                    if current_price >= opt.strike:
                        shares_to_sell = opt.contracts * 100

                        self.transactions.append({
                            'date': current_date,
                            'action': 'CALL_EXERCISED',
                            'ticker': opt.ticker,
                            'contracts': opt.contracts,
                            'strike': opt.strike,
                            'current_price': current_price,
                            'shares_sold': shares_to_sell
                        })
                        TradingAction.sell_stock(self.portfolio, opt.ticker,
                                                shares_to_sell, opt.strike)

                elif opt.option_type == 'put' and opt.position == 'short':
                    if current_price <= opt.strike:
                        shares_to_buy = opt.contracts * 100

                        self.transactions.append({
                            'date': current_date,
                            'action': 'PUT_EXERCISED',
                            'ticker': opt.ticker,
                            'contracts': opt.contracts,
                            'strike': opt.strike,
                            'current_price': current_price,
                            'shares_bought': shares_to_buy
                        })
                        TradingAction.buy_stock(self.portfolio, opt.ticker,
                                               shares_to_buy, opt.strike)

        for i in sorted(expired_options, reverse=True):
            self.portfolio.options.pop(i)

    def run(self) -> pd.DataFrame:
        if not self.market_data:
            self.load_market_data()

        trading_dates = self.market_data[self.tickers[0]].index

        for current_date in trading_dates:

            TradingAction.set_transaction_log(self.transactions, current_date)

            current_prices = self._get_current_prices(current_date)

            self._handle_option_expirations(current_date, current_prices)

            current_date_tz = current_date
            if hasattr(self.market_data[self.tickers[0]].index, 'tz') and self.market_data[self.tickers[0]].index.tz is not None:
                if current_date.tzinfo is None:
                    current_date_tz = pd.Timestamp(current_date).tz_localize(self.market_data[self.tickers[0]].index.tz)

            market_data = {
                'date': current_date,
                'prices': current_prices,
                'data': {ticker: self.market_data[ticker].loc[:current_date_tz]
                        for ticker in self.tickers},
                'volatility': {ticker: self.volatility_data[ticker].loc[:current_date_tz]
                              for ticker in self.tickers if ticker in self.volatility_data}
            }

            self.strategy_callback(
                date=current_date,
                portfolio=self.portfolio,
                market_data=market_data,
                actions=TradingAction
            )

            current_volatility = None
            if self.tickers[0] in self.volatility_data:
                vol_data = self.volatility_data[self.tickers[0]].loc[:current_date_tz]
                if len(vol_data) > 0:
                    vol = vol_data.iloc[-1, 0] if hasattr(vol_data.iloc[-1], '__iter__') else vol_data.iloc[-1]
                    if not pd.isna(vol):
                        current_volatility = vol

            stock_value = self.portfolio.get_stock_value(current_prices)
            options_value = self.portfolio.get_options_value(current_date, current_prices, current_volatility)
            total_value = self.portfolio.get_total_value(current_date, current_prices, current_volatility)

            self.history.append({
                'date': current_date,
                'cash': self.portfolio.cash,
                'stock_value': stock_value,
                'options_value': options_value,
                'total_value': total_value
            })

        return pd.DataFrame(self.history)

    def get_transactions(self) -> pd.DataFrame:
        if not self.transactions:
            return pd.DataFrame()
        return pd.DataFrame(self.transactions)

    def print_performance_stats(self) -> Dict:
        if not self.history:
            return {}

        df = pd.DataFrame(self.history)
        initial_value = self.initial_cash
        final_value = df['total_value'].iloc[-1]

        returns = df['total_value'].pct_change().dropna()

        trading_days = len(df)
        total_return_pct = (final_value / initial_value - 1) * 100
        annualized_return_pct = (
            ((final_value / initial_value) ** (252 / trading_days) - 1) * 100
            if trading_days > 0 and initial_value > 0
            else 0
        )

        stats = {
            'initial_value': initial_value,
            'final_value': final_value,
            'total_return': total_return_pct,
            'annualized_return': annualized_return_pct,
            'sharpe_ratio': returns.mean() / returns.std() * np.sqrt(252) if len(returns) > 0 else 0,
            'max_drawdown': ((df['total_value'].cummax() - df['total_value']) / df['total_value'].cummax()).max() * 100,
            'volatility': returns.std() * np.sqrt(252) * 100
        }

        return stats
