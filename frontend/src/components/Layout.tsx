import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SyncModal from './SyncModal';
import { employeesApi } from '../api/services';

export const Layout: React.FC = () => {
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const res = await employeesApi.list({ pending_id_only: true, limit: 1 });
      setPendingCount(res.total);
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenSyncModal={() => setSyncModalOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar pendingCount={pendingCount} />
        
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet context={{ refreshPendingCount: fetchPendingCount }} />
        </main>
      </div>

      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSuccess={() => {
          fetchPendingCount();
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Layout;
