import axiosInstance from "./axios";

const getEarningsCalendar = (params?: { tickers?: string; days_ahead?: number }) =>
  axiosInstance.get('earnings-calendar/', { params });

const earningsCalendarService = { getEarningsCalendar };

export default earningsCalendarService;
