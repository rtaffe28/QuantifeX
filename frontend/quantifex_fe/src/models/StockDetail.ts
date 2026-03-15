export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

export interface EarningsReport {
  quarter: string;
  actual_eps: number | null;
  estimated_eps: number | null;
}

export interface FinancialPeriod {
  period: string;
  revenue: number | null;
  net_income: number | null;
}

export interface Volatility {
  beta: number | null;
  std_dev_30d: number | null;
  std_dev_90d: number | null;
}

export interface StockDetail {
  symbol: string;
  name: string;
  current_price: number | null;
  change_today: number | null;
  change_today_pct: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  price_history: PricePoint[];
  earnings: EarningsReport[];
  annual_financials: FinancialPeriod[];
  quarterly_financials: FinancialPeriod[];
  volatility: Volatility;
}
