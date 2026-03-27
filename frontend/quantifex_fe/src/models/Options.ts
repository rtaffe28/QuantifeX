export interface OptionsPriceParams {
  symbol?: string;
  spot: number;
  strike: number;
  expiry_days: number;
  iv: number;
  rate: number;
  option_type: "call" | "put";
}

export interface OptionsGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsic_value: number;
  time_value: number;
  breakeven: number;
}
