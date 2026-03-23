import axiosInstance from "./axios";

const ROUTE = "backtesting";

const getStrategies = async () => {
  return axiosInstance.get(`${ROUTE}/strategies/`);
};

const submitBacktest = async (payload: {
  ticker: string;
  strategy: string;
  parameters: Record<string, number>;
  start_date: string;
  end_date: string;
  initial_capital: number;
}) => {
  return axiosInstance.post(`${ROUTE}/run/`, payload);
};

const getBacktestRuns = async () => {
  return axiosInstance.get(`${ROUTE}/runs/`);
};

const getBacktestRun = async (id: number) => {
  return axiosInstance.get(`${ROUTE}/runs/${id}/`);
};

const deleteBacktestRun = async (id: number) => {
  return axiosInstance.delete(`${ROUTE}/runs/${id}/`);
};

const backtestingService = {
  getStrategies,
  submitBacktest,
  getBacktestRuns,
  getBacktestRun,
  deleteBacktestRun,
};

export default backtestingService;
