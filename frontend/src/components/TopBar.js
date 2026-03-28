'use client';
import { Search, Bell, ChevronDown, Zap } from 'lucide-react';

export default function TopBar({ title }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h2 className="topbar-title">{title}</h2>
        </div>

        <div className="topbar-right">
          <div className="topbar-search hide-mobile">
            <Search size={15} />
            <input type="text" placeholder="Search..." />
          </div>

          <button className="topbar-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="topbar-badge">3</span>
          </button>

          <div className="topbar-user">
            <div className="topbar-avatar">U</div>
            <ChevronDown size={14} />
          </div>
        </div>
      </header>

      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          right: 0;
          left: var(--sidebar-width);
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          background: var(--bg-secondary);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-bottom: 1px solid var(--glass-border);
          z-index: 40;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: left var(--transition-base);
        }

        .topbar-title {
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .topbar-search {
          position: relative;
          display: flex;
          align-items: center;
        }

        .topbar-search :global(svg) {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary);
        }

        .topbar-search input {
          width: 220px;
          padding: var(--space-2) var(--space-4) var(--space-2) 38px;
          background: var(--bg-primary);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          outline: none;
          transition: all var(--transition-base);
          box-shadow: var(--neu-shadow-in-sm);
        }

        .topbar-search input:focus {
          border-color: var(--primary-500);
          box-shadow: var(--neu-shadow-in-sm), 0 0 0 3px rgba(124, 58, 237, 0.1);
          width: 280px;
        }

        .topbar-search input::placeholder {
          color: var(--text-tertiary);
        }

        .topbar-icon-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--neu-shadow-out-sm);
          transition: all var(--transition-base);
        }

        .topbar-icon-btn:hover {
          color: var(--text-primary);
        }

        .topbar-icon-btn:active {
          box-shadow: var(--neu-shadow-in-sm);
          color: var(--primary-400);
        }

        .topbar-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-secondary);
          box-shadow: 0 0 6px rgba(124, 58, 237, 0.5);
        }

        .topbar-user {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-full);
          transition: background var(--transition-fast);
        }

        .topbar-user:hover {
          background: var(--glass-bg);
        }

        .topbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
        }

        @media (max-width: 768px) {
          .topbar {
            left: 0;
            padding: 0 var(--space-5);
            background: var(--bg-secondary);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          }

          .topbar-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}
