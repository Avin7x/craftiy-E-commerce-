import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";


const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    set({ loading: true });

    try {
      const res = await axios.post("/auth/sign-up", {
        name,
        email,
        password,
      });

      set({
        user: res.data.user,
        loading: false,
        checkingAuth: false
      });

      toast.success(res.data.message || "Account created successfully");
    } catch (error) {
      set({ loading: false, checkingAuth: false });
      toast.error(
        error.response?.data?.message || "An error occurred, try again later"
      );
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/sign-in", { email, password });

      set({
        user: res.data.user,
        loading: false,
      });

      toast.success(res.data.message || "Login successful");
    } catch (error) {
      set({ loading: false });
      toast.error(
        error.response?.data?.message || "An error occurred, try again later"
      );
    }
  },

  logout: async () => {
    set({ loading: true });

    try {
      await axios.post("/auth/logout");

      set({
        user: null,
        loading: false,
        checkingAuth: false
      });

      toast.success("Logged out successfully");
      
    } catch (error) {
      set({ loading: false , checkingAuth: false});
      toast.error(
        error.response?.data?.message || "An error occurred, try again later"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });

    try {
      const res = await axios.get("/auth/profile");

      set({
        user: res.data,
        checkingAuth: false,
      });
      //console.log(res.data.user);
    } catch {
      set({
        user: null,
        checkingAuth: false,
      });
    }
  },

  refreshToken: async () => {
      console.log("Refresh started");

     const res = await axios.post("/auth/refresh-token");
     console.log("Refresh success");
      return res.data;
   
  }
}));

// axious interceptor for token refresh 
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    //prevents infinite loop if refresh-token returns 401
    if (originalRequest.url?.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      try {
        // Start refresh only once
        if (!refreshPromise) {
          refreshPromise = useUserStore
            .getState()
            .refreshToken()
            .finally(() => {
              refreshPromise = null;
            });
        }

        // Wait for ongoing refresh
        await refreshPromise;

        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
          useUserStore.setState({ user: null });
          return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default useUserStore;
