export interface StrategyParam {
  key: string;
  label: string;
  type: "number" | "string";
  default: number | string;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  parameters: StrategyParam[];
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface TradeLogEntry {
  [key: string]: string | number | null;
}

export interface BacktestResult {
  total_return_pct: number;
  annualized_return_pct: number | null;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  total_trades: number;
  final_portfolio_value: number;
  equity_curve: EquityPoint[];
  trade_log: TradeLogEntry[];
  completed_at: string;
}

export interface BacktestRun {
  id: number;
  ticker: string;
  strategy: string;
  parameters: Record<string, number | string>;
  start_date: string;
  end_date: string;
  initial_capital: number;
  status: "pending" | "running" | "complete" | "failed";
  error_message: string;
  created_at: string;
  result?: BacktestResult;
}
