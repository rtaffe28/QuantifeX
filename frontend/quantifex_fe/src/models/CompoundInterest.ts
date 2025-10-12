export interface CalculationData {
  year: number;
  principal: number;
  interest: number;
  total: number;
  totalContributions: number;
}

export interface CalculatorInputs {
  initialAmount: number;
  yearlyContribution: number;
  annualRate: number;
  years: number;
}
