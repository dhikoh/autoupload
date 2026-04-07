'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { user, logout, isAdmin, isAdminOrStaff, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!isAdminOrStaff) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/topups', label: 'Top-Up', icon: '💳' },
    { href: '/admin/ranking', label: 'Ranking', icon: '🏆' },
    ...(isAdmin ? [
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
      { href: '/admin/staff', label: 'Staff', icon: '🛡️' },
      { href: '/admin/security', label: 'Security', icon: '🔐' },
    ] : []),
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>🚀 AutoPost Hub</h2>
          <span className="admin-badge">{user?.role === 'superadmin' ? 'ADMIN' : 'STAFF'}</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <p className="admin-user-name">{user?.name}</p>
            <p className="admin-user-email">{user?.email}</p>
          </div>
          <button onClick={logout} className="admin-logout-btn">Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
