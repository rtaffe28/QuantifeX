import axiosInstance from "./axios";

const ROUTE = "transactions";

const getTransactions = async () => {
    const res = await axiosInstance.get(`${ROUTE}/`);
    return res;
};

const addTransaction = async (data: {
    date: string;
    type: string;
    description: string;
    amount: number;
}) => {
    const res = await axiosInstance.post(`${ROUTE}/`, data);
    return res;
};

const deleteTransaction = async (id: number) => {
    const res = await axiosInstance.delete(`${ROUTE}/delete/${id}/`);
    return res;
};

const transactionsService = {
    getTransactions,
    addTransaction,
    deleteTransaction,
};

export default transactionsService;
