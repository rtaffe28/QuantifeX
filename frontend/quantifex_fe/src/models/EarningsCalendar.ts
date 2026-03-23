export interface EarningsEvent {
  ticker: string;
  company_name: string;
  earnings_date: string;
  earnings_time: 'BMO' | 'AMC' | 'N/A';
  eps_estimate: number | null;
  eps_previous: number | null;
  revenue_estimate: number | null;
  days_until: number;
}

export interface EarningsCalendarResponse {
  events: EarningsEvent[];
  fetched_at: string;
}
