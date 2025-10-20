import axiosInstance from "./axios";

const ROUTE = "user";

const registerUser = async (username: string, password: string) => {
  const res = await axiosInstance.post(`${ROUTE}/register/`, {
    username,
    password,
  });
  return res;
};

const getUser = async () => {
  const res = await axiosInstance.get(`${ROUTE}/`);
  return res.data;
};

const userService = {
  registerUser,
  getUser,
};

export default userService;
