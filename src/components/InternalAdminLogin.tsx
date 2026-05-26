"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/config";

export default function InternalAdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"credentials" | "otp">("credentials");
    const [sessionEmail, setSessionEmail] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const otp = otpDigits.join("");

    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const handleOtpChange = useCallback(
        (index: number, value: string) => {
            if (value.length > 1) {
                const digits = value.replace(/\D/g, "").slice(0, 6).split("");
                const next = [...otpDigits];
                digits.forEach((d, i) => {
                    if (index + i < 6) next[index + i] = d;
                });
                setOtpDigits(next);
                const focusIdx = Math.min(index + digits.length, 5);
                otpRefs.current[focusIdx]?.focus();
                return;
            }
            const digit = value.replace(/\D/g, "");
            const next = [...otpDigits];
            next[index] = digit;
            setOtpDigits(next);
            if (digit && index < 5) otpRefs.current[index + 1]?.focus();
        },
        [otpDigits],
    );

    const handleOtpKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent) => {
            if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
                const next = [...otpDigits];
                next[index - 1] = "";
                setOtpDigits(next);
                otpRefs.current[index - 1]?.focus();
            }
        },
        [otpDigits],
    );

    const handleLogin = async () => {
        setError("");
        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }
        if (!password) {
            setError("Please enter your password.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError((data.message as string) || (data.error as string) || "Login failed");
                return;
            }
            setSessionEmail(email);
            setStep("otp");
            setOtpDigits(["", "", "", "", "", ""]);
            setResendTimer(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: sessionEmail, password }),
            });
            if (res.ok) {
                setOtpDigits(["", "", "", "", "", ""]);
                setResendTimer(60);
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            } else {
                setError("Failed to resend OTP");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError("");
        const code = otpDigits.join("");
        if (code.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_VERIFY_OTP, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: sessionEmail, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError((data.message as string) || (data.error as string) || "OTP verification failed");
                return;
            }
            router.push("/internal/dashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-[#eef1f5] font-sans text-[#0b1a33]">
            <div className="hidden min-h-screen flex-1 flex-col justify-between bg-[#0b1a33] p-10 text-white lg:flex">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Helix Internal</p>
                    <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">Analytics support access</h1>
                    <p className="mt-3 max-w-md text-sm text-slate-300">
                        Sign in with your internal admin account, then choose a facility to view usage, performance,
                        staffing, and transfer analytics for that tenant.
                    </p>
                </div>
                <p className="text-xs text-slate-400">Platform staff only. All act-as sessions are audited.</p>
            </div>

            <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl border border-[#e2e6ec] bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-semibold">
                        {step === "credentials" ? "Internal sign in" : "Verify OTP"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {step === "credentials"
                            ? "Use your Helix internal admin credentials."
                            : `Enter the 6-digit code sent to ${sessionEmail}`}
                    </p>

                    {error ? (
                        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    ) : null}

                    {step === "credentials" ? (
                        <div className="mt-6 space-y-4">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Email
                                <input
                                    type="email"
                                    className="mt-1.5 w-full rounded-lg border border-[#e2e6ec] bg-[#f1f4f8] px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </label>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Password
                                <div className="relative mt-1.5">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full rounded-lg border border-[#e2e6ec] bg-[#f1f4f8] px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </label>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleLogin}
                                className="w-full rounded-lg bg-[#0b1a33] py-2.5 text-sm font-semibold text-white hover:bg-[#14254a] disabled:opacity-60"
                            >
                                {loading ? "Sending OTP…" : "Continue"}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6">
                            <div className="flex justify-center gap-2">
                                {otpDigits.map((d, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => {
                                            otpRefs.current[i] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="h-12 w-10 rounded-lg border border-[#e2e6ec] bg-[#f1f4f8] text-center text-lg font-semibold outline-none focus:border-blue-500"
                                        value={d}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                disabled={loading || otp.length !== 6}
                                onClick={handleVerifyOtp}
                                className="mt-6 w-full rounded-lg bg-[#0b1a33] py-2.5 text-sm font-semibold text-white hover:bg-[#14254a] disabled:opacity-60"
                            >
                                {loading ? "Verifying…" : "Verify & continue"}
                            </button>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    className="text-slate-600 hover:text-slate-900"
                                    onClick={() => {
                                        setStep("credentials");
                                        setOtpDigits(["", "", "", "", "", ""]);
                                        setError("");
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="text-blue-600 disabled:text-slate-400"
                                    disabled={resendTimer > 0 || loading}
                                    onClick={handleResendOtp}
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Facility admin?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
