import axiosInstance from "./axios";

const ROUTE = "watchlist";

const getWatchlist = async () => {
    const res = await axiosInstance.get(`${ROUTE}/`);
    return res;
};

const addToWatchlist = async (ticker: string) => {
    const res = await axiosInstance.post(`${ROUTE}/`, {
        ticker: ticker
    });
    return res;
};

const deleteFromWatchlist = async (id: number) => {
    const res = await axiosInstance.delete(`${ROUTE}/delete/${id}`);
    return res;
};

const watchlistService = {
    getWatchlist,
    addToWatchlist,
    deleteFromWatchlist,
};

export default watchlistService;