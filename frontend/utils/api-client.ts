import axios from "axios";
import { clearAuthSession } from "./auth-storage";

const apiClient = axios.create();

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hasAuthHeader = Boolean(error?.config?.headers?.Authorization);
    const isUnauthorized = status === 401 || status === 403;

    if (typeof window !== "undefined" && hasAuthHeader && isUnauthorized) {
      clearAuthSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
