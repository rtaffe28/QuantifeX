export interface Holding {
  ticker: string;
  weight: number; // decimal, e.g. 0.40 = 40%
}

export interface MonteCarloPayload {
  holdings: Holding[];
  initial_value: number;
  monthly_contribution: number;
  years: number;
  simulations: number;
  historical_period: string;
  risk_free_rate: number;
}

export interface MonteCarloStats {
  median_final: number;
  mean_final: number;
  p10_final: number;
  p90_final: number;
  prob_double: number;
  prob_triple: number;
  prob_loss: number;
  expected_annual_return: number;
  portfolio_volatility: number;
}

export interface MonteCarloResult {
  years: number;
  initial_value: number;
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  time_labels: string[];
  stats: MonteCarloStats;
}
