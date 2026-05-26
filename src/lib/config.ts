export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const API_ENDPOINTS = {
    ADMIN_LOGIN: `/api/proxy/auth/admin/login`,
    ADMIN_VERIFY_OTP: `/api/proxy/auth/admin/verify-otp`,
    INTERNAL_LOGIN: `/api/proxy/auth/internal/login`,
    INTERNAL_VERIFY_OTP: `/api/proxy/auth/internal/verify-otp`,
    AUTH_ME: `/api/proxy/auth/me`,
    LOGOUT: `/api/proxy/auth/logout`,
    FACILITIES: `/api/proxy/facilities`,
    INTERNAL_FACILITIES: `/api/proxy/internal/facilities`,
    INTERNAL_ACT_AS: `/api/proxy/internal/act-as`,
    INTERNAL_EXIT_ACT_AS: `/api/proxy/internal/exit-act-as`,
};
