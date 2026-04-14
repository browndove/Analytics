export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const API_ENDPOINTS = {
    ADMIN_LOGIN: `/api/proxy/auth/admin/login`,
    ADMIN_VERIFY_OTP: `/api/proxy/auth/admin/verify-otp`,
    AUTH_ME: `/api/proxy/auth/me`,
    LOGOUT: `/api/proxy/auth/logout`,
    FACILITIES: `/api/proxy/facilities`,
};
