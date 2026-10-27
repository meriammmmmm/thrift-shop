'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const FIELD_CLS = "block w-full px-4 py-3 border border-rose-100 rounded-xl shadow-sm text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm";
const FOCUS_RING = "focus:ring-[#731528]/30";

interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  optionalPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '', email: '', phone: '', optionalPhone: '',
    address: '', city: '', state: '', zipCode: '', country: 'Tunisia'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const data = await api.login({ email: formData.email, password: formData.password });
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Welcome back! Redirecting…');
        setTimeout(() => router.push(data.user.role === 'ADMIN' ? '/admin' : '/'), 1200);
      } else {
        const emailToUse = userInfo.email || formData.email;
        const data = await api.register({
          email: emailToUse,
          password: formData.password,
          name: userInfo.fullName || formData.name,
          companyId: process.env.NEXT_PUBLIC_COMPANY_ID ? parseInt(process.env.NEXT_PUBLIC_COMPANY_ID) : undefined,
          userInfo: { ...userInfo, email: emailToUse }
        });
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Account created! Welcome 🎉');
        setTimeout(() => router.push('/'), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hc = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const hui = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setUserInfo(p => ({ ...p, [e.target.name]: e.target.value }));
  const switchMode = () => { setIsLogin(v => !v); setError(''); setSuccess(''); };

  return (
    <>
      <style>{`
        @keyframes lp-fade-up {
          from { opacity:0; transform:translateY(24px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes lp-shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lp-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-20px) scale(1.12); }
        }
        @keyframes lp-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-20px,28px) scale(0.9); }
        }
        .lp-card { animation: lp-fade-up 0.55s cubic-bezier(0.23,1,0.32,1) both; }
        .lp-btn-shimmer::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.3) 50%,transparent 60%);
          background-size:200% 100%;
          animation: lp-shimmer 1.8s linear infinite;
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
          <div style={{ position:'absolute', top:'10%', left:'6%', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.06)', animation:'lp-orb1 8s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'16%', right:'3%', width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', animation:'lp-orb2 10s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'30%', width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', animation:'lp-orb1 6s ease-in-out infinite reverse' }} />

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
              {isLogin ? 'Welcome back 💕' : 'Join us today ✨'}
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              {isLogin
                ? 'Sign in to continue shopping, track orders, and save your favourites.'
                : 'Create your account and explore hundreds of unique thrift pieces.'}
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
          <div className="lp-card w-full" style={{ maxWidth: 460 }}>

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
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={switchMode} className="font-semibold hover:underline" style={{ color: '#731528' }}>
                    {isLogin ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="text-base mt-0.5">⚠️</span><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  <span className="text-base">✅</span><span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── SIGN UP FIELDS ── */}
                {!isLogin && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1">Personal Info</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LabelField label="Full Name *" id="fullName" name="fullName" type="text" required value={userInfo.fullName} onChange={hui} placeholder="Your full name" />
                      <LabelField label="Email *" id="userEmail" name="email" type="email" required value={userInfo.email} onChange={hui} placeholder="you@example.com" />
                      <LabelField label="Phone *" id="phone" name="phone" type="tel" required value={userInfo.phone} onChange={hui} placeholder="+216 XX XXX XXX" />
                      <LabelField label="Optional Phone" id="optionalPhone" name="optionalPhone" type="tel" value={userInfo.optionalPhone} onChange={hui} placeholder="Alternative number" />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-2">Delivery Address</p>
                    <LabelField label="Street Address *" id="address" name="address" type="text" required value={userInfo.address} onChange={hui} placeholder="123 Main Street" />
                    <div className="grid grid-cols-3 gap-3">
                      <LabelField label="City *" id="city" name="city" type="text" required value={userInfo.city} onChange={hui} placeholder="Tunis" />
                      <LabelField label="State *" id="state" name="state" type="text" required value={userInfo.state} onChange={hui} placeholder="Tunis" />
                      <LabelField label="ZIP *" id="zipCode" name="zipCode" type="text" required value={userInfo.zipCode} onChange={hui} placeholder="1000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select name="country" value={userInfo.country} onChange={hui} className={`${FIELD_CLS} ${FOCUS_RING}`}>
                        <option>Tunisia</option><option>USA</option><option>Canada</option>
                        <option>UK</option><option>France</option><option>Germany</option><option>Other</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── LOGIN FIELDS ── */}
                {isLogin && (
                  <LabelField label="Email address" id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={hc} placeholder="you@example.com" />
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isLogin ? 'Password' : 'Create Password *'}
                  </label>
                  <div className="relative">
                    <input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required value={formData.password} onChange={hc}
                      placeholder="••••••••"
                      className={`${FIELD_CLS} ${FOCUS_RING} pr-11`}
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

                {/* Forgot password */}
                {isLogin && (
                  <div className="text-right -mt-1">
                    <button type="button" onClick={() => router.push('/forgot-password')}
                      className="text-xs hover:underline" style={{ color: '#731528' }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="lp-btn-shimmer relative w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 overflow-hidden mt-2"
                  style={{
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg,#731528,#9B3550)',
                    boxShadow: loading ? 'none' : '0 8px 30px rgba(115,21,40,0.35)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'lp-spin 0.7s linear infinite' }} />
                      Loading…
                    </span>
                  ) : (
                    <span className="relative z-10">{isLogin ? '✨ Sign In' : '🎉 Create Account'}</span>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(115,21,40,0.12)' }} />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(115,21,40,0.12)' }} />
                </div>

                <button type="button" onClick={() => router.push('/')}
                  className="w-full py-3 rounded-2xl border text-sm font-medium text-gray-600 hover:bg-white/60 transition-all"
                  style={{ borderColor: 'rgba(115,21,40,0.2)', background: 'rgba(255,255,255,0.4)' }}>
                  ← Continue browsing without account
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LabelField({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={id} className={`${FIELD_CLS} ${FOCUS_RING}`} {...props} />
    </div>
  );
}