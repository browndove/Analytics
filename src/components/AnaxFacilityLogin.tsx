'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/config';

/** Strip non-alphanumerics and force uppercase */
function normalizeFacilityCode(raw: string): string {
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export default function AnaxFacilityLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [facilityCode, setFacilityCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [sessionEmail, setSessionEmail] = useState('');
    const [sessionFacilityCode, setSessionFacilityCode] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const otp = otpDigits.join('');

    const extractFacilityIdFromPayload = (raw: unknown): string => {
        if (!raw || typeof raw !== 'object') return '';
        const rec = raw as Record<string, unknown>;
        const user = rec.user && typeof rec.user === 'object' ? rec.user as Record<string, unknown> : null;
        const staff = rec.staff && typeof rec.staff === 'object' ? rec.staff as Record<string, unknown> : null;

        const candidates = [
            rec.facility_id,
            rec.facilityId,
            rec.current_facility_id,
            rec.currentFacilityId,
            user?.facility_id,
            user?.facilityId,
            user?.current_facility_id,
            user?.currentFacilityId,
            staff?.facility_id,
            staff?.facilityId,
            staff?.current_facility_id,
            staff?.currentFacilityId,
        ];

        const match = candidates.find(v => typeof v === 'string' && v.trim());
        return typeof match === 'string' ? match.trim() : '';
    };

    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const handleOtpChange = useCallback((index: number, value: string) => {
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const next = [...otpDigits];
            digits.forEach((d, i) => { if (index + i < 6) next[index + i] = d; });
            setOtpDigits(next);
            const focusIdx = Math.min(index + digits.length, 5);
            otpRefs.current[focusIdx]?.focus();
            return;
        }
        const digit = value.replace(/\D/g, '');
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    }, [otpDigits]);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            const next = [...otpDigits];
            next[index - 1] = '';
            setOtpDigits(next);
            otpRefs.current[index - 1]?.focus();
        }
    }, [otpDigits]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = async () => {
        setError('');
        const code = normalizeFacilityCode(facilityCode);
        if (!code) {
            setError('Please enter your facility code.');
            showToast('Please enter your facility code.', 'error');
            return;
        }
        if (!email.trim()) {
            setError('Please enter your email.');
            showToast('Please enter your email.', 'error');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            showToast('Please enter your password.', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, facility_code: code }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Login failed');
                showToast(data.message || 'Login failed', 'error');
                setLoading(false);
                return;
            }
            setSessionEmail(email);
            setSessionFacilityCode(code);
            setStep('otp');
            setOtpDigits(['', '', '', '', '', '']);
            setResendTimer(60);
            showToast('OTP sent to your email', 'success');
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Network error. Please try again.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sessionEmail, password, facility_code: sessionFacilityCode }),
            });
            if (res.ok) {
                setOtpDigits(['', '', '', '', '', '']);
                setResendTimer(60);
                showToast('New OTP sent to your email', 'success');
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            } else {
                showToast('Failed to resend OTP', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        const code = otpDigits.join('');
        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            showToast('Please enter a valid 6-digit OTP.', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_VERIFY_OTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sessionEmail, otp, facility_code: sessionFacilityCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'OTP verification failed');
                showToast(data.message || 'OTP verification failed', 'error');
                setLoading(false);
                return;
            }
            showToast('Login successful! Redirecting...', 'success');
            try {
                if (!extractFacilityIdFromPayload(data)) {
                    await fetch(API_ENDPOINTS.AUTH_ME).catch(() => null);
                }
            } catch { /* best effort */ }
            setTimeout(() => router.push('/'), 1500);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Network error. Please try again.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setOtpDigits(['', '', '', '', '', '']);
        setError('');
    };

    // ------------------------------------------------------------------
    // Palette & shared styles (scoped to this component)
    // ------------------------------------------------------------------
    const C = {
        navy900: '#0b1a33',
        navy800: '#0f2447',
        navy700: '#163362',
        accent: '#3b82f6',
        accentHover: '#2563eb',
        panelBg: '#eef1f5',
        cardBg: '#ffffff',
        border: '#e2e6ec',
        borderStrong: '#cfd5de',
        textDark: '#0b1a33',
        textBody: '#475569',
        textMuted: '#6b7689',
        textFaint: '#94a0b2',
        inputBg: '#f1f4f8',
        cta: '#0b1a33',
        ctaHover: '#14254a',
        errorBg: '#fef2f2',
        errorBorder: '#fecaca',
        errorText: '#b91c1c',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: C.textMuted,
        marginBottom: 6,
    };

    const inputWrapStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: C.inputBg,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    };

    const inputStyle: React.CSSProperties = {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        padding: '12px 14px 12px 40px',
        fontSize: 14,
        color: C.textDark,
        fontFamily: 'inherit',
        borderRadius: 10,
    };

    const iconLeftStyle: React.CSSProperties = {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 18,
        color: C.textFaint,
        pointerEvents: 'none',
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            background: C.panelBg,
            color: C.textDark,
            fontFamily: "'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
        }}>
            {/* ============================================================
                LEFT PANEL — Dark brand side
               ============================================================ */}
            <div
                className="login-left"
                style={{
                    flex: '1 1 50%',
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden',
                    background: C.navy900,
                    color: '#fff',
                    padding: '40px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                {/* Animated aurora gradient */}
                <div
                    aria-hidden
                    className="login-aurora"
                    style={{
                        position: 'absolute',
                        inset: '-20%',
                        background: `radial-gradient(ellipse 60% 50% at 20% 30%, ${C.navy700} 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 80% 70%, #1e4a8a 0%, transparent 65%), radial-gradient(ellipse 55% 50% at 60% 20%, #2563eb33 0%, transparent 60%), ${C.navy900}`,
                        pointerEvents: 'none',
                    }}
                />
                {/* Grid overlay */}
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        backgroundPosition: '-1px -1px',
                        pointerEvents: 'none',
                        maskImage: 'radial-gradient(ellipse at 30% 40%, #000 40%, transparent 90%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, #000 40%, transparent 90%)',
                    }}
                />
                {/* Soft glow */}
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-15%',
                        width: 520,
                        height: 520,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)',
                        filter: 'blur(20px)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Top: brand lockup */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
                        <img
                            src="/assets/images/helix-logo.png"
                            alt="Helix"
                            width={32}
                            height={32}
                            style={{ height: 32, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.4))' }}
                        />
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.2em',
                                color: 'rgba(255,255,255,0.85)',
                            }}
                        >
                            HELIX ANALYTICS
                        </span>
                    </div>

                    <h1
                        style={{
                            fontSize: 'clamp(2.6rem, 5vw, 3.6rem)',
                            fontWeight: 900,
                            letterSpacing: '-0.03em',
                            margin: 0,
                            lineHeight: 1.05,
                            color: '#ffffff',
                        }}
                    >
                        Helix
                    </h1>
                    <h2
                        style={{
                            fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            margin: '6px 0 20px',
                            color: '#ffffff',
                        }}
                    >
                        Facility Analytics
                    </h2>
                    <p
                        style={{
                            maxWidth: 420,
                            fontSize: 13.5,
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.7)',
                            margin: 0,
                        }}
                    >
                        For facility and hospital staff who track usage and analytics on Helix.
                        Sign in with your work email and password. Helix will email
                        you a one-time code to confirm it&apos;s you.
                    </p>
                </div>

                {/* Bottom: fine-print */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p
                        style={{
                            fontSize: 11.5,
                            color: 'rgba(255,255,255,0.45)',
                            margin: 0,
                            letterSpacing: '0.02em',
                        }}
                    >
                        Analytics dashboard — not the patient app or ward staff mobile sign-in.
                    </p>
                </div>
            </div>

            {/* ============================================================
                RIGHT PANEL — Form side
               ============================================================ */}
            <div
                className="login-right"
                style={{
                    flex: '1 1 50%',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 24px',
                    background: C.panelBg,
                }}
            >
                <div style={{ width: '100%', maxWidth: 440 }}>
                    {/* Eyebrow */}
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: 10.5,
                            fontWeight: 700,
                            letterSpacing: '0.22em',
                            color: C.textMuted,
                            textTransform: 'uppercase',
                            marginBottom: 10,
                        }}
                    >
                        Admin sign-in
                    </div>
                    <h2
                        style={{
                            textAlign: 'center',
                            fontSize: '1.6rem',
                            fontWeight: 700,
                            color: C.textDark,
                            margin: '0 0 24px',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Helix Facility Analytics
                    </h2>

                    {/* Card */}
                    <div
                        style={{
                            background: C.cardBg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 16,
                            padding: '22px 22px 24px',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
                        }}
                    >
                        {/* Info chip */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#eef4ff',
                                border: '1px solid #dce7fb',
                                borderRadius: 10,
                                padding: '8px 12px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#1e3a5f',
                                marginBottom: 12,
                            }}
                        >
                            <span className="material-icons-round" style={{ fontSize: 15, color: '#2563eb' }}>lock</span>
                            {step === 'credentials' ? 'Facility code & Helix password' : 'Two-factor verification'}
                        </div>
                        <p
                            style={{
                                fontSize: 12.5,
                                color: C.textBody,
                                lineHeight: 1.55,
                                margin: '0 0 18px',
                            }}
                        >
                            {step === 'credentials' ? (
                                <>Use your facility&apos;s Helix code and the admin email and password your organization gave you. Helix will email you a short code to finish signing in.</>
                            ) : (
                                <>Enter the 6-digit code we sent to <strong style={{ color: C.textDark }}>{sessionEmail}</strong>.</>
                            )}
                        </p>

                        {error && (
                            <div
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    background: C.errorBg,
                                    border: `1px solid ${C.errorBorder}`,
                                    color: C.errorText,
                                    fontSize: 12.5,
                                    fontWeight: 500,
                                    marginBottom: 14,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {step === 'credentials' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Facility code */}
                                <div>
                                    <label style={labelStyle} htmlFor="facility-code">Facility Helix Code</label>
                                    <div style={inputWrapStyle}>
                                        <span className="material-icons-round" style={iconLeftStyle}>business</span>
                                        <input
                                            id="facility-code"
                                            type="text"
                                            value={facilityCode}
                                            onChange={e => setFacilityCode(normalizeFacilityCode(e.target.value))}
                                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                            style={{
                                                ...inputStyle,
                                                fontFamily: "'Courier New', Courier, monospace",
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                            }}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <p style={{ fontSize: 11, color: C.textFaint, margin: '6px 0 0' }}>
                                        Letters and numbers only. Shown in capitals.
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={labelStyle} htmlFor="email">Work email</label>
                                    <div style={inputWrapStyle}>
                                        <span className="material-icons-round" style={iconLeftStyle}>mail</span>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                            style={inputStyle}
                                            autoComplete="email"
                                            placeholder="you@hospital.org"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={labelStyle} htmlFor="password">Helix password</label>
                                    <div style={inputWrapStyle}>
                                        <span className="material-icons-round" style={iconLeftStyle}>key</span>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                            style={{ ...inputStyle, paddingRight: 42 }}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword(p => !p)}
                                            style={{
                                                position: 'absolute',
                                                right: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: C.textMuted,
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: 4,
                                            }}
                                        >
                                            <span className="material-icons-round" style={{ fontSize: 18 }}>
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                                        <button
                                            type="button"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: C.accentHover,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    id="sign-in-btn"
                                    onClick={handleLogin}
                                    disabled={loading}
                                    style={{
                                        marginTop: 4,
                                        width: '100%',
                                        padding: '13px 16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: C.cta,
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.75 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        transition: 'background 0.15s, transform 0.05s',
                                    }}
                                    onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = C.ctaHover); }}
                                    onMouseLeave={e => { (e.currentTarget.style.background = C.cta); }}
                                >
                                    {loading ? 'Signing in…' : 'Continue to Helix'}
                                    {!loading && (
                                        <span className="material-icons-round" style={{ fontSize: 17 }}>arrow_forward</span>
                                    )}
                                </button>
                            </div>
                        ) : (
                            // OTP STEP
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
                                <div
                                    style={{
                                        width: 54, height: 54, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #eef4ff, #dbe8ff)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <span className="material-icons-round" style={{ fontSize: 26, color: '#1e3a5f' }}>
                                        verified_user
                                    </span>
                                </div>

                                {sessionFacilityCode && (
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: '#eef4ff',
                                            border: '1px solid #dce7fb',
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            color: '#1e3a5f',
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: 13 }}>business</span>
                                        Facility {sessionFacilityCode}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    {otpDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            onFocus={e => e.target.select()}
                                            maxLength={6}
                                            style={{
                                                width: 44, height: 52,
                                                textAlign: 'center',
                                                fontSize: 22, fontWeight: 700,
                                                borderRadius: 10,
                                                border: `1.5px solid ${digit ? C.navy800 : C.borderStrong}`,
                                                background: digit ? '#f7faff' : '#fff',
                                                color: C.textDark,
                                                outline: 'none',
                                                transition: 'border-color 0.15s, background 0.15s',
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    id="verify-otp-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length !== 6}
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: C.cta,
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                                        opacity: loading || otp.length !== 6 ? 0.6 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {loading ? 'Verifying…' : 'Verify & continue'}
                                    {!loading && (
                                        <span className="material-icons-round" style={{ fontSize: 17 }}>arrow_forward</span>
                                    )}
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, width: '100%' }}>
                                    <button
                                        onClick={handleBackToCredentials}
                                        disabled={loading}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: C.textMuted,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>arrow_back</span>
                                        Back
                                    </button>
                                    <div style={{ width: 1, height: 14, background: C.border }} />
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={loading || resendTimer > 0}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: resendTimer > 0 ? C.textFaint : C.accentHover,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>refresh</span>
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer links under card */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 18 }}>
                        {[
                            { icon: 'help_outline', label: 'Help & support' },
                            { icon: 'shield', label: 'Privacy' },
                        ].map(item => (
                            <button
                                key={item.label}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: C.textMuted,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: 14 }}>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className="toast-enter"
                    style={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        zIndex: 999,
                        background: '#fff',
                        border: `1px solid ${toast.type === 'error' ? C.errorBorder : '#c7eccb'}`,
                        borderRadius: 10,
                        padding: '12px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: toast.type === 'error' ? C.errorText : '#166534',
                        boxShadow: '0 6px 20px rgba(15,23,42,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>
                        {toast.type === 'error' ? 'error' : 'check_circle'}
                    </span>
                    {toast.message}
                </div>
            )}

            {/* Responsive: stack on small screens */}
            <style jsx>{`
                @media (max-width: 900px) {
                    :global(.login-left) {
                        display: none !important;
                    }
                    :global(.login-right) {
                        flex: 1 1 100% !important;
                    }
                }
                :global(.login-aurora) {
                    animation: auroraDrift 18s ease-in-out infinite alternate;
                    will-change: transform, filter;
                    filter: blur(40px) saturate(1.1);
                }
                @keyframes auroraDrift {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        filter: blur(40px) saturate(1.05) hue-rotate(0deg);
                    }
                    50% {
                        transform: translate3d(3%, -2%, 0) scale(1.06);
                        filter: blur(50px) saturate(1.2) hue-rotate(-8deg);
                    }
                    100% {
                        transform: translate3d(-2%, 2%, 0) scale(1.03);
                        filter: blur(45px) saturate(1.1) hue-rotate(6deg);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    :global(.login-aurora) {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
