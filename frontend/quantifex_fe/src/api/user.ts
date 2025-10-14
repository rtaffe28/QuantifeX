import axiosInstance from "./axios";
import type { User } from "@/models/Auth";

const ROUTE = "user";

const registerUser = async (username: string, password: string) => {
  const res = await axiosInstance.post(`${ROUTE}/register/`, {
    username,
    password,
  });
  return res;
};

const getUser = async (): Promise<User> => {
  const res = await axiosInstance.get<User>(`${ROUTE}/`);
  return res.data;
};

const userService = {
  registerUser,
  getUser,
};

export default userService;
