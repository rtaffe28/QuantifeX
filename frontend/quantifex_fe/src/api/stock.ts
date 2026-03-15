import axiosInstance from "./axios";

const ROUTE = "stock";

const getStockDetail = async (symbol: string) => {
    const res = await axiosInstance.get(`${ROUTE}/${symbol}/`);
    return res;
};

const stockService = {
    getStockDetail,
};

export default stockService;
