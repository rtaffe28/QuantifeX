import axiosInstance from "./axios";
import type { OptionsPriceParams } from "@/models/Options";

const getOptionsPrice = (params: OptionsPriceParams) =>
  axiosInstance.get("options/price/", { params });

const optionsService = {
  getOptionsPrice,
};

export default optionsService;
