'use client';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { useState } from 'react';

export default function TopBar({ title = 'Dashboard' }) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button className="topbar-menu-btn hide-desktop">
            <Menu size={20} />
          </button>
          <h4 className="topbar-title">{title}</h4>
        </div>

        <div className="topbar-right">
          <div className={`topbar-search ${searchFocused ? 'focused' : ''}`}>
            <Search size={16} className="topbar-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="topbar-search-input"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <button className="topbar-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="topbar-notification-dot"></span>
          </button>

          <div className="topbar-user">
            <div className="topbar-user-avatar">U</div>
            <ChevronDown size={14} className="topbar-user-chevron" />
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
          background: rgba(6, 6, 15, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          z-index: 40;
          transition: left var(--transition-base);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .topbar-title {
          font-weight: 700;
          color: var(--text-primary);
        }

        .topbar-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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
          width: 220px;
          transition: width var(--transition-base);
        }

        .topbar-search.focused {
          width: 300px;
        }

        .topbar-search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .topbar-search-input {
          width: 100%;
          padding: 8px 12px 8px 38px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          outline: none;
          transition: all var(--transition-base);
        }

        .topbar-search-input::placeholder {
          color: var(--text-tertiary);
        }

        .topbar-search-input:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .topbar-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .topbar-icon-btn:hover {
          background: var(--glass-bg-hover);
          color: var(--text-primary);
        }

        .topbar-notification-dot {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 7px;
          height: 7px;
          background: var(--error-500);
          border-radius: 50%;
          border: 1.5px solid var(--bg-primary);
        }

        .topbar-user {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .topbar-user:hover {
          background: var(--glass-bg);
        }

        .topbar-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
        }

        .topbar-user-chevron {
          color: var(--text-tertiary);
        }

        @media (max-width: 768px) {
          .topbar {
            left: 0;
            padding: 0 var(--space-4);
          }

          .topbar-search {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
