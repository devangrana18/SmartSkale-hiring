import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { authApi } from '../api/services';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isSessionExpired =
    searchParams.get('reason') === 'session_expired' ||
    sessionStorage.getItem('smartskale_session_expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Successfully logged in as HR Admin', 'success', 'Welcome Back');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(
        err.message || 'Login failed. Please check your credentials.',
        'error',
        'Authentication Error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotEmail(email || '');
    setForgotStep(1);
    setForgotOtp('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotError(null);
    setDevOtpHint(null);
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
        setForgotOtp(res.dev_otp);
      }
      showToast(res.message || 'Verification code sent to your email.', 'success', 'OTP Sent');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send verification code. User might not exist.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotOtp || forgotOtp.trim().length < 4) {
      setForgotError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (forgotNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.resetPassword(forgotEmail, forgotOtp.trim(), forgotNewPass);
      showToast(res.message || 'Password successfully reset.', 'success', 'Password Updated');
      setEmail(forgotEmail);
      setPassword(forgotNewPass);
      setShowForgotModal(false);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Check verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-smartskale-indigo/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-smartskale-navy to-smartskale-indigo text-white font-black text-2xl shadow-xl mb-4">
          S
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">SmartSkale</h1>
        <p className="mt-1 text-sm font-medium text-slate-400">
          Hiring & Employee Document Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-white/20">
          {/* Session Expiry Notification */}
          {isSessionExpired && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-fade-in">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-950">Session Expired Due to Inactivity</p>
                <p className="text-amber-800 mt-0.5">
                  For your security, you were signed out because no activity was detected. Please log in again to continue.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                HR Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smartskale.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-xs font-bold text-smartskale-indigo hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-smartskale-navy hover:bg-indigo-950 transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to HR Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <div className="inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Enterprise Document Engine & Google Sheets Bridge</span>
          </div>
        </div>
      </div>

      {/* Forgot Password / Reset OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {forgotStep === 1 ? 'Reset Password' : 'Enter Verification Code'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {forgotStep === 1
                      ? 'Receive a secure 6-digit code via email'
                      : `Sent to ${forgotEmail}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {forgotError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {devOtpHint && (
                <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Dev Mode Auto-Generated OTP:</p>
                    <p className="font-mono text-sm font-bold tracking-widest text-smartskale-indigo mt-0.5">
                      {devOtpHint}
                    </p>
                  </div>
                </div>
              )}

              {forgotStep === 1 ? (
                /* STEP 1: Enter Email */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the email address registered with your SmartSkale HR account. We will send you a 6-digit verification code to reset your password.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="hr@smartskale.com"
                        className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-950 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <span>Sending Code...</span>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: Enter OTP & New Password */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      6-Digit Verification Code (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="block w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={forgotShowPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowPass(!forgotShowPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {forgotShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="Re-enter new password"
                        className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      ← Back to email
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-950 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <span>Resetting...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Reset Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
