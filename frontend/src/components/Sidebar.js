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

/* Mobile bottom nav: 5 items with FAB center */
const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/queue', icon: ListOrdered, label: 'Queue' },
  { href: '/dashboard/new-post', icon: PlusCircle, label: 'Post', isMain: true },
  { href: '/dashboard/accounts', icon: Link2, label: 'Accounts' },
  { href: '/dashboard/settings', icon: Settings, label: 'More' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ====== DESKTOP SIDEBAR ====== */}
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
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {active && <div className="sidebar-active-indicator" />}
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

      {/* ====== MOBILE BOTTOM NAV — XPDC HUB PILL STYLE ====== */}
      <nav className="pwa-bottom-nav hide-desktop">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          if (item.isMain) {
            return (
              <Link key={item.href} href={item.href} className={`pwa-nav-fab ${active ? 'active' : ''}`}>
                <item.icon size={26} />
                <span>{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pwa-nav-item ${active ? 'active' : ''}`}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        /* =============================================================
           DESKTOP SIDEBAR — NeuGlass
           ============================================================= */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-secondary);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: width var(--transition-base);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
        }

        .sidebar-collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5);
          border-bottom: 1px solid var(--glass-border);
          min-height: var(--topbar-height);
        }

        .sidebar-logo-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
        }

        .sidebar-logo-text {
          font-size: 1.125rem;
          font-weight: 800;
          white-space: nowrap;
          letter-spacing: -0.02em;
        }

        .sidebar-toggle {
          margin-left: auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: none;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--neu-shadow-out-sm);
          transition: all var(--transition-fast);
        }

        .sidebar-toggle:hover {
          color: var(--text-primary);
        }

        .sidebar-toggle:active {
          box-shadow: var(--neu-shadow-in-sm);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) var(--space-3);
          display: flex;
          flex-direction: column;
          gap: 2px;
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
          font-size: 0.8125rem;
          font-weight: 500;
          transition: all var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-nav-item:hover {
          color: var(--text-primary);
          background: rgba(124, 58, 237, 0.05);
        }

        .sidebar-nav-item.active {
          color: var(--primary-400);
          background: var(--bg-primary);
          box-shadow: var(--neu-shadow-in-sm);
        }

        .sidebar-active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--gradient-primary);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.5);
        }

        .sidebar-footer {
          padding: var(--space-4);
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
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
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

        .sidebar-logout { flex-shrink: 0; }

        /* =============================================================
           PWA MOBILE BOTTOM NAV — Floating Pill (XPDC HUB style)
           ============================================================= */
        .pwa-bottom-nav {
          position: fixed;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: 92%;
          max-width: 460px;
          height: 68px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 50;
          border-radius: 40px;
          background: var(--bg-secondary);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            var(--neu-shadow-out);
          padding: 0 6px;
          border: 1px solid var(--glass-border);
        }

        .pwa-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 18px;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          font-size: 0.55rem;
          font-weight: 700;
          gap: 3px;
          letter-spacing: 0.3px;
        }

        .pwa-nav-item:active {
          transform: scale(0.92);
        }

        .pwa-nav-item.active {
          color: var(--primary-400);
          background: var(--bg-primary);
          box-shadow: var(--neu-shadow-in-sm);
        }

        .pwa-nav-item.active :global(svg) {
          filter: drop-shadow(0 0 4px rgba(124, 58, 237, 0.4));
        }

        /* FAB Center — Main Action */
        .pwa-nav-fab {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transform: translateY(-14px);
          box-shadow:
            0 8px 24px rgba(124, 58, 237, 0.4),
            inset 2px 2px 6px rgba(255, 255, 255, 0.2);
          border: 5px solid var(--bg-secondary);
          z-index: 10;
          flex-shrink: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.6rem;
          font-weight: 800;
          gap: 2px;
          letter-spacing: 0.5px;
        }

        .pwa-nav-fab:active {
          transform: translateY(-12px) scale(0.93);
          box-shadow:
            0 4px 12px rgba(124, 58, 237, 0.3),
            inset 4px 4px 8px rgba(0, 0, 0, 0.25);
        }

        .pwa-nav-fab.active {
          background: var(--primary-700);
          box-shadow:
            0 4px 12px rgba(124, 58, 237, 0.3),
            inset 4px 4px 8px rgba(0, 0, 0, 0.2);
          transform: translateY(-12px);
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
