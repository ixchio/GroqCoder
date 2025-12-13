import axios from "axios";
import MY_TOKEN_KEY from "./get-cookie-name";

export const api = axios.create({
  baseURL: `/api`,
  headers: {
    cache: "no-store",
  },
});

export const apiServer = axios.create({
  baseURL: process.env.NEXT_APP_API_URL as string,
  headers: {
    cache: "no-store",
  },
});

api.interceptors.request.use(
  async (config) => {
    // get the token from cookies
    const cookie_name = MY_TOKEN_KEY();
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${cookie_name}=`))
      ?.split("=")[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle the error
    return Promise.reject(error);
  }
);
