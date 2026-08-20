import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, Check, AlertCircle, Eye, EyeOff, User as UserIcon, Mail, Shield } from 'lucide-react';
import { authApi } from '../api/services';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'password' | 'profile';
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Handle Profile (Name & Email) Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!fullName.trim()) {
      setProfileError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    setProfileLoading(true);
    try {
      const updatedUser = await authApi.updateProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      // Update local storage user
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      showToast('Account details updated successfully! Please use your new email next time you log in.', 'success', 'Profile Updated');
      onClose();
      // Reload window to refresh state across components cleanly
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update account details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authApi.changePassword(oldPassword, newPassword);
      showToast(res.message || 'Password changed successfully', 'success', 'Security Updated');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Account Settings</h3>
              <p className="text-xs text-slate-300">Manage real email, name & password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-smartskale-indigo text-smartskale-indigo'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Email</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-smartskale-indigo text-smartskale-indigo'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Tab 1: Profile Details (Name & Real Email) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            {profileError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Devan Sharma"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Real Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@company.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                You will use this email address to log in to the portal.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-950 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {profileLoading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-950 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
