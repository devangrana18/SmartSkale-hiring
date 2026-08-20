import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  History,
  FileCheck2,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingCount = 0 }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentType = location.pathname === '/generate' ? (searchParams.get('type') || 'offer_letter') : null;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount} New` : undefined,
    },
    {
      name: 'Document Generator',
      path: '/generate',
      icon: FileText,
      highlight: true,
    },
    {
      name: 'Document History',
      path: '/history',
      icon: History,
    },
  ];

  const templateShortcuts = [
    {
      type: 'offer_letter',
      name: 'Offer Letter',
      icon: FileCheck2,
      iconColor: 'text-indigo-500',
    },
    {
      type: 'internship_certificate',
      name: 'Internship Certificate',
      icon: GraduationCap,
      iconColor: 'text-emerald-500',
    },
    {
      type: 'nda',
      name: 'Non-Disclosure (NDA)',
      icon: ShieldAlert,
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-smartskale-navy text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Document Templates shortcuts */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Standard Templates
          </p>
          <div className="space-y-1 text-xs">
            {templateShortcuts.map((tpl) => {
              const isTplActive = currentType === tpl.type;
              const Icon = tpl.icon;
              return (
                <NavLink
                  key={tpl.type}
                  to={`/generate?type=${tpl.type}`}
                  id={`sidebar-tpl-${tpl.type}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium ${
                    isTplActive
                      ? 'bg-indigo-50 text-smartskale-indigo font-bold border border-indigo-200/70 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tpl.iconColor}`} />
                  <span>{tpl.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Status Card */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">Google Drive Synced</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Form responses spreadsheet connected & ready for document generation.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
