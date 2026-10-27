'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELD_CLS = "block w-full px-4 py-3 border border-rose-100 rounded-xl shadow-sm text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm";
const FOCUS_RING = "focus:ring-[#731528]/30";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://thrift-shop-backend-production.up.railway.app/api';

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        if (data.dev && data.code) {
          setDevCode(data.code);
          setMessage(`${data.message}\n\nDevelopment Mode — Your code is: ${data.code}`);
        }
        setStep('code');
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Code verified! Now set your new password.');
        setStep('password');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to login…');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fp-fade-up {
          from { opacity:0; transform:translateY(24px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fp-shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes fp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fp-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-20px) scale(1.12); }
        }
        @keyframes fp-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-20px,28px) scale(0.9); }
        }
        .fp-card { animation: fp-fade-up 0.55s cubic-bezier(0.23,1,0.32,1) both; }
        .fp-btn-shimmer::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.3) 50%,transparent 60%);
          background-size:200% 100%;
          animation: fp-shimmer 1.8s linear infinite;
          border-radius: inherit;
        }
      `}</style>

      <div className="min-h-screen flex overflow-hidden" style={{
        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 30%, #fce4ec 60%, #f3e5f5 100%)'
      }}>

        {/* ── Left decorative panel ── */}
        <div className="hidden lg:flex flex-col justify-between relative overflow-hidden py-10 px-8"
          style={{
            background: 'linear-gradient(160deg,#731528 0%,#9B3550 50%,#b5476a 100%)',
            width: '38%',
            minWidth: 320,
            maxWidth: 420,
          }}>

          {/* Animated orbs */}
          <div style={{ position:'absolute', top:'10%', left:'6%', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.06)', animation:'fp-orb1 8s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'16%', right:'3%', width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', animation:'fp-orb2 10s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'30%', width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', animation:'fp-orb1 6s ease-in-out infinite reverse' }} />

          {/* Brand name — no image, no white box */}
          <div className="relative z-10">
            <div
              className="text-2xl font-bold tracking-wide cursor-pointer text-white hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Georgia, serif' }}
              onClick={() => router.push('/')}
            >
              Mery Rose
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-white text-2xl font-bold leading-snug mb-2">
              {step === 'email' ? 'Reset your password 💕' : step === 'code' ? 'Check your inbox 📬' : 'Almost there ✨'}
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              {step === 'email'
                ? "Enter your email and we'll send you a code to reset your password."
                : step === 'code'
                ? 'Enter the 6-digit code we sent to your email address.'
                : 'Create a strong new password to secure your account.'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2">
            {['🌿 Sustainable', '💸 Affordable', '✨ Unique'].map(t => (
              <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.13)', color: '#fff' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 overflow-y-auto">
          <div className="fp-card w-full" style={{ maxWidth: 460 }}>

            {/* Card — solid white background */}
            <div className="rounded-3xl pt-9 pb-8 sm:pt-10 sm:pb-9 px-8 sm:px-10" style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px rgba(115,21,40,0.12), 0 4px 16px rgba(115,21,40,0.08)',
            }}>

              {/* Logo at top of card — clean, no filters */}
              <div className="flex justify-center mb-5 -mt-1">
                <img
                  src="/images/mery-rose-logo.png"
                  alt="Mery Rose"
                  className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push('/')}
                />
              </div>

              {/* Header */}
              <div className="mb-6 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {step === 'email' ? 'Reset Password' : step === 'code' ? 'Verify Code' : 'New Password'}
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  {step === 'email' && (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => router.push('/signup')} className="font-semibold hover:underline" style={{ color: '#731528' }}>
                        Sign up free
                      </button>
                    </>
                  )}
                  {step === 'code' && 'Check your email for the 6-digit code'}
                  {step === 'password' && 'Create a strong password for your account'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="text-base mt-0.5">⚠️</span><span>{error}</span>
                </div>
              )}
              {message && (
                <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm whitespace-pre-line">
                  <span className="text-base">✅</span><span>{message}</span>
                </div>
              )}

              {/* Step 1: Email */}
              {step === 'email' && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`${FIELD_CLS} ${FOCUS_RING}`}
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="fp-btn-shimmer relative w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 overflow-hidden mt-2"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg,#731528,#9B3550)',
                      boxShadow: loading ? 'none' : '0 8px 30px rgba(115,21,40,0.35)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'fp-spin 0.7s linear infinite' }} />
                        Sending…
                      </span>
                    ) : '✨ Send Reset Code'}
                  </button>
                </form>
              )}

              {/* Step 2: Verification Code */}
              {step === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label htmlFor="fp-code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input
                      id="fp-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      maxLength={6}
                      className={`${FIELD_CLS} ${FOCUS_RING} text-center text-2xl tracking-widest`}
                      placeholder="000000"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Check your email for the 6-digit code</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="fp-btn-shimmer relative w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 overflow-hidden mt-2"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg,#731528,#9B3550)',
                      boxShadow: loading ? 'none' : '0 8px 30px rgba(115,21,40,0.35)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'fp-spin 0.7s linear infinite' }} />
                        Verifying…
                      </span>
                    ) : '✨ Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); setMessage(''); }}
                    className="w-full py-2.5 rounded-2xl border text-sm font-medium text-gray-500 hover:bg-white/60 transition-all"
                    style={{ borderColor: 'rgba(115,21,40,0.15)', background: 'rgba(255,255,255,0.3)' }}
                  >
                    ← Back to email
                  </button>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'password' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="fp-new-pw" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        id="fp-new-pw"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`${FIELD_CLS} ${FOCUS_RING} pr-11`}
                        placeholder="At least 6 characters"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          }
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fp-confirm-pw" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="fp-confirm-pw"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`${FIELD_CLS} ${FOCUS_RING} pr-11`}
                        placeholder="Re-enter your password"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showConfirmPassword
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          }
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="fp-btn-shimmer relative w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 overflow-hidden mt-2"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg,#731528,#9B3550)',
                      boxShadow: loading ? 'none' : '0 8px 30px rgba(115,21,40,0.35)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'fp-spin 0.7s linear infinite' }} />
                        Resetting…
                      </span>
                    ) : '✨ Reset Password'}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(115,21,40,0.12)' }} />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(115,21,40,0.12)' }} />
              </div>

              {/* Back to Login */}
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-2xl border text-sm font-medium text-gray-600 hover:bg-white/60 transition-all"
                style={{ borderColor: 'rgba(115,21,40,0.2)', background: 'rgba(255,255,255,0.4)' }}
              >
                ← Remember your password? Sign In
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
