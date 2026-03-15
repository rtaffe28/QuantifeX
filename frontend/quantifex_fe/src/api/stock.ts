import axiosInstance from "./axios";

const ROUTE = "stock";

const getStockDetail = async (symbol: string, period: string = "1y") => {
    const res = await axiosInstance.get(`${ROUTE}/${symbol}/`, {
        params: { period },
    });
    return res;
};

const stockService = {
    getStockDetail,
};

export default stockService;
