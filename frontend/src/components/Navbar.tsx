import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, User as UserIcon, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import { employeesApi } from '../api/services';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onSyncSuccess?: () => void;
  onOpenSyncModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSyncModal }) => {
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSync = async () => {
    if (onOpenSyncModal) {
      onOpenSyncModal();
      return;
    }
    setSyncing(true);
    try {
      await employeesApi.sync();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
        {/* Left: Organization Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-smartskale-navy flex items-center justify-center text-white font-black text-lg shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-smartskale-navy tracking-tight">SmartSkale</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-smartskale-indigo border border-indigo-100">
                HR Portal
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Hiring & Employee Document Management System
            </p>
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-3">
          <button
            id="btn-quick-sync"
            onClick={handleQuickSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-smartskale-indigo border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-smartskale-navy to-smartskale-indigo text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.full_name || 'HR Admin'}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{user?.email || 'hr@smartskale.com'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Popover */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.full_name || 'HR Admin'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'hr@smartskale.com'}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Role: {user?.role || 'HR'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-smartskale-indigo flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    <span>Account Settings (Email & Name)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-smartskale-indigo flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Account Settings / Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};

export default Navbar;

