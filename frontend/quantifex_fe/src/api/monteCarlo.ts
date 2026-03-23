import axiosInstance from "./axios";
import type { MonteCarloPayload } from "@/models/MonteCarlo";

const runSimulation = (payload: MonteCarloPayload) =>
  axiosInstance.post("monte-carlo/simulate/", payload);

const monteCarloService = { runSimulation };

export default monteCarloService;
