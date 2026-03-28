'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Link2,
  CalendarDays,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/new-post', icon: PlusCircle, label: 'New Post' },
  { href: '/dashboard/queue', icon: ListOrdered, label: 'Upload Queue' },
  { href: '/dashboard/accounts', icon: Link2, label: 'Accounts' },
  { href: '/dashboard/schedule', icon: CalendarDays, label: 'Schedule' },
  { href: '/dashboard/history', icon: History, label: 'History' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={22} />
          </div>
          {!collapsed && <span className="sidebar-logo-text">AutoPost<span className="text-gradient">Hub</span></span>}
          <button
            className="sidebar-toggle hide-mobile"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'var(--transition-base)' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && <div className="sidebar-active-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <span>U</span>
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">User</span>
                <span className="sidebar-user-plan">Free Plan</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="btn btn-ghost btn-sm sidebar-logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav hide-desktop">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: rgba(10, 10, 30, 0.85);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: width var(--transition-base);
        }

        .sidebar-collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5) var(--space-5);
          border-bottom: 1px solid var(--glass-border);
          min-height: var(--topbar-height);
        }

        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          font-size: 1.125rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .sidebar-toggle {
          margin-left: auto;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-toggle:hover {
          background: var(--glass-bg-hover);
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          overflow-y: auto;
        }

        .sidebar-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--text-tertiary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-nav-item:hover {
          color: var(--text-primary);
          background: var(--glass-bg);
        }

        .sidebar-nav-item.active {
          color: var(--text-primary);
          background: rgba(124, 58, 237, 0.12);
        }

        .sidebar-active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--gradient-primary);
          border-radius: 0 3px 3px 0;
        }

        .sidebar-footer {
          padding: var(--space-4) var(--space-4);
          border-top: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .sidebar-avatar {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .sidebar-user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sidebar-user-plan {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }

        .sidebar-logout {
          flex-shrink: 0;
        }

        /* Mobile bottom nav */
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(10, 10, 30, 0.95);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-top: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 50;
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: var(--space-2);
          color: var(--text-tertiary);
          font-size: 0.625rem;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .mobile-nav-item.active {
          color: var(--primary-400);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
