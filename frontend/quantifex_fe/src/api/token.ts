import axiosInstance from "./axios";

const ROUTE = "token";

const postToken = async (username: string, password: string) => {
  const res = await axiosInstance.post(`${ROUTE}/`, {
    username,
    password,
  });
  return res;
};

const postRefresh = async (refreshToken: string) => {
  const res = await axiosInstance.post(
    "/token/refresh/",
    {
      refresh: refreshToken,
    }
  );
  return res;
}

const tokenService = {
  postToken,
  postRefresh
};

export default tokenService;
