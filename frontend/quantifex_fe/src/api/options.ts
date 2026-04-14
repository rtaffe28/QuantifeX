import axiosInstance from "./axios";
import type { OptionsPriceParams } from "@/models/Options";

const getOptionsPrice = (params: OptionsPriceParams) =>
  axiosInstance.get("options/price/", { params });

const getOptionsData = async (symbol: string, expiration?: string) => {
    const params: Record<string, string> = {};
    if (expiration) params.expiration = expiration;
    const res = await axiosInstance.get(`options/${symbol}/`, { params });
    return res;
};

const optionsService = {
    getOptionsPrice,
    getOptionsData,
};

export default optionsService;
