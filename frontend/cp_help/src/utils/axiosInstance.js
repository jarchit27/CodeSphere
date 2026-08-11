import axios from "axios";
import { BASE_URL } from "./constants";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout:10000,
    headers:{
        "Content-Type":"application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config)=>{
        const accessToken = localStorage.getItem("token");
        if(accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;

    },
    (error)=>{
        return Promise.reject(error);
    }
);

// Global response interceptor: if ANY API call returns 401 (Unauthorized),
// it means the token is expired or invalid. Automatically log the user out
// and redirect to login. This eliminates the need to handle 401 in every page.
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            // Only redirect if we're not already on the login or signup page
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance