export interface OptionContract {
  strike: number | null;
  lastPrice: number | null;
  bid: number | null;
  ask: number | null;
  change: number | null;
  percentChange: number | null;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
  inTheMoney: boolean;
  moneyness: number | null;
}

export interface IVSkewPoint {
  strike: number;
  iv: number;
  moneyness: number | null;
}

export interface IVSkew {
  calls: IVSkewPoint[];
  puts: IVSkewPoint[];
}

export interface RVWindow {
  window: string;
  rv: number;
}

export interface RVSeriesPoint {
  date: string;
  rv: number;
}

export interface IVRV {
  atm_iv: number | null;
  rv_windows: RVWindow[];
  rv_series: RVSeriesPoint[];
}

export interface TermStructurePoint {
  expiration: string;
  dte: number | null;
  atm_iv: number;
}

export interface VolumeOIByStrike {
  strike: number;
  callVolume: number;
  callOI: number;
  putVolume: number;
  putOI: number;
}

export interface OptionsSummary {
  total_call_volume: number;
  total_put_volume: number;
  total_call_oi: number;
  total_put_oi: number;
  pc_volume_ratio: number | null;
  pc_oi_ratio: number | null;
  max_pain: number | null;
}

export interface GreeksEntry {
  strike: number;
  iv: number | null;
  volume: number;
  openInterest: number;
  bid: number | null;
  ask: number | null;
}

export interface OptionsData {
  symbol: string;
  name: string;
  current_price: number;
  expirations: string[];
  selected_expiration: string;
  days_to_expiry: number | null;
  calls: OptionContract[];
  puts: OptionContract[];
  iv_skew: IVSkew;
  summary: OptionsSummary;
  iv_rv: IVRV;
  term_structure: TermStructurePoint[];
  volume_oi_by_strike: VolumeOIByStrike[];
  greeks: {
    calls: GreeksEntry[];
    puts: GreeksEntry[];
  };
}
