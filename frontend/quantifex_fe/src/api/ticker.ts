import axiosInstance from "./axios";

const ROUTE = "tickers";

const getTickers = async () => {
    const res = await axiosInstance.get(`${ROUTE}/`);
    return res;
};


const tickerService = {
    getTickers,
};

export default tickerService;