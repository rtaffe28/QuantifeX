import math
from datetime import datetime
from celery import shared_task


@shared_task
def execute_backtest(run_id):
    from .models import BacktestRun, BacktestResult

    run = BacktestRun.objects.get(id=run_id)
    run.status = BacktestRun.STATUS_RUNNING
    run.save()

    try:
        from quant_models.utils.simulation import BacktestSimulation
        from quant_models.strategies.buy_and_hold_strategy import create_buy_and_hold_strategy
        from quant_models.strategies.moving_average_strategy import create_sma_crossover_strategy
        from quant_models.strategies.covered_call_strategy import create_covered_call_strategy
        from quant_models.strategies.leap_strategy import create_leap_strategy
        from quant_models.strategies.wheel_strategy import create_wheel_strategy

        ticker = run.ticker.upper()
        params = run.parameters or {}

        start_dt = datetime(run.start_date.year, run.start_date.month, run.start_date.day)
        end_dt = datetime(run.end_date.year, run.end_date.month, run.end_date.day)

        strategy_factories = {
            "buy_and_hold": lambda: create_buy_and_hold_strategy(ticker),
            "sma_crossover": lambda: create_sma_crossover_strategy(
                ticker,
                short_window=int(params.get("short_window", 50)),
                long_window=int(params.get("long_window", 200)),
            ),
            "covered_call": lambda: create_covered_call_strategy(
                ticker,
                strike_factor=float(params.get("strike_factor", 1.06)),
                interest_rate=float(params.get("interest_rate", 0.05)),
            ),
            "leap": lambda: create_leap_strategy(
                ticker,
                strike_factor=float(params.get("strike_factor", 1.1)),
                days=int(params.get("days", 365)),
                interest_rate=float(params.get("interest_rate", 0.05)),
            ),
            "wheel": lambda: create_wheel_strategy(
                ticker,
                put_strike_factor=float(params.get("put_strike_factor", 0.95)),
                call_strike_factor=float(params.get("call_strike_factor", 1.05)),
                days_to_expiration=int(params.get("days_to_expiration", 30)),
                interest_rate=float(params.get("interest_rate", 0.05)),
            ),
        }

        strategy_callback = strategy_factories[run.strategy]()

        sim = BacktestSimulation(
            tickers=[ticker],
            start_date=start_dt,
            end_date=end_dt,
            initial_cash=float(run.initial_capital),
            strategy_callback=strategy_callback,
        )

        sim.load_market_data()
        portfolio_history = sim.run()
        transactions_df = sim.get_transactions()
        stats = sim.print_performance_stats()

        equity_curve = []
        if portfolio_history is not None and not portfolio_history.empty:
            value_col = _find_value_column(portfolio_history)
            for date, row in portfolio_history.iterrows():
                date_str = str(date.date()) if hasattr(date, "date") else str(date)
                equity_curve.append({"date": date_str, "value": round(float(row[value_col]), 2)})

        trade_log = []
        if transactions_df is not None and not transactions_df.empty:
            for _, row in transactions_df.iterrows():
                entry = {}
                for col in transactions_df.columns:
                    val = row[col]
                    if hasattr(val, "date"):
                        val = str(val.date())
                    elif hasattr(val, "item"):
                        val = val.item()
                    elif isinstance(val, float) and math.isnan(val):
                        val = None
                    entry[col] = val
                trade_log.append(entry)

        total_return_pct = _extract_pct(stats, ["total_return", "Total Return", "return"])
        annualized_return_pct = _extract_pct(
            stats, ["annualized_return", "annualized_volatility", "Annualized Return"]
        )
        max_drawdown_pct = _extract_pct(stats, ["max_drawdown", "Max Drawdown", "drawdown"])
        sharpe_ratio = float(stats.get("sharpe_ratio", stats.get("Sharpe Ratio", 0)) or 0)
        final_value = float(
            stats.get("final_value", stats.get("final_portfolio_value", run.initial_capital))
            or run.initial_capital
        )

        BacktestResult.objects.create(
            run=run,
            total_return_pct=total_return_pct,
            annualized_return_pct=annualized_return_pct,
            max_drawdown_pct=max_drawdown_pct,
            sharpe_ratio=sharpe_ratio,
            total_trades=len(trade_log),
            final_portfolio_value=final_value,
            equity_curve=equity_curve,
            trade_log=trade_log,
        )

        run.status = BacktestRun.STATUS_COMPLETE

    except Exception as exc:
        run.status = BacktestRun.STATUS_FAILED
        run.error_message = str(exc)

    finally:
        run.save()


def _find_value_column(df):
    for candidate in ["total_value", "portfolio_value", "Total Value", "Portfolio Value", "value"]:
        if candidate in df.columns:
            return candidate
    numeric_cols = df.select_dtypes(include="number").columns
    if len(numeric_cols) > 0:
        df["_total"] = df[numeric_cols].sum(axis=1)
        return "_total"
    return df.columns[0]


def _extract_pct(stats, keys):
    for k in keys:
        val = stats.get(k)
        if val is not None:
            f = float(val)
            return f * 100 if abs(f) < 2 else f
    return 0.0
