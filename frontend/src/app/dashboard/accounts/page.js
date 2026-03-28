'use client';
import TopBar from '../../../components/TopBar';
import {
  Plus, MoreVertical, RefreshCw, Unlink, CheckCircle2, AlertCircle,
  ExternalLink
} from 'lucide-react';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon as XBrandIcon, ThreadsIcon } from '../../../components/PlatformBadge';

const accounts = [
  { id: 1, platform: 'youtube', name: 'AutoPost Creator', avatar: '🎬', type: 'Brand Account', status: 'connected', connectedDate: 'Mar 10, 2026' },
  { id: 2, platform: 'facebook', name: 'AutoPost Hub Page', avatar: '📘', type: 'Page', status: 'connected', connectedDate: 'Mar 12, 2026' },
  { id: 3, platform: 'instagram', name: '@autopost.hub', avatar: '📸', type: 'Business', status: 'connected', connectedDate: 'Mar 12, 2026' },
  { id: 4, platform: 'tiktok', name: '@autoposthub', avatar: '🎵', type: 'Creator', status: 'expired', connectedDate: 'Mar 15, 2026' },
  { id: 5, platform: 'threads', name: '@autopost.hub', avatar: '🧵', type: 'Personal', status: 'connected', connectedDate: 'Mar 18, 2026' },
];

const availablePlatforms = [
  { id: 'youtube', name: 'YouTube', icon: YouTubeIcon, color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: '#00F2EA' },
  { id: 'x', name: 'X (Twitter)', icon: XBrandIcon, color: '#fff' },
  { id: 'threads', name: 'Threads', icon: ThreadsIcon, color: '#fff' },
];

const platformIcons = { youtube: YouTubeIcon, facebook: FacebookIcon, instagram: InstagramIcon, tiktok: TikTokIcon, x: XBrandIcon, threads: ThreadsIcon };

export default function AccountsPage() {
  return (
    <>
      <TopBar title="Connected Accounts" />
      <div className="page-content">
        <div className="accounts-header animate-fade-in">
          <div>
            <p className="text-secondary">Manage your social media connections</p>
          </div>
          <button className="btn btn-primary"><Plus size={16} /> Add Account</button>
        </div>

        {/* Connected accounts */}
        <div className="accounts-grid">
          {accounts.map((acc, i) => {
            const PlatIcon = platformIcons[acc.platform];
            return (
              <div key={acc.id} className={`account-card glass-card-static animate-fade-in-up delay-${i + 1}`}>
                <div className="account-card-top">
                  <div className="account-platform-icon" data-platform={acc.platform}>
                    <PlatIcon size={22} />
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm">
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="account-info">
                  <div className="account-avatar">{acc.avatar}</div>
                  <h4>{acc.name}</h4>
                  <span className="text-xs text-tertiary">{acc.type}</span>
                </div>

                <div className="account-footer">
                  <span className={`badge ${acc.status === 'connected' ? 'badge-success' : 'badge-error'}`}>
                    {acc.status === 'connected' ? <><CheckCircle2 size={10} /> Connected</> : <><AlertCircle size={10} /> Expired</>}
                  </span>
                  <span className="text-xs text-tertiary">Since {acc.connectedDate}</span>
                </div>

                {acc.status === 'expired' && (
                  <button className="btn btn-outline btn-sm w-full account-reconnect">
                    <RefreshCw size={14} /> Reconnect
                  </button>
                )}
              </div>
            );
          })}

          {/* Add new account card */}
          <div className="account-card add-card glass-card">
            <div className="add-card-icon">
              <Plus size={28} />
            </div>
            <h4>Connect Account</h4>
            <p className="text-sm text-tertiary">Link a new social media platform</p>
            <div className="add-card-platforms">
              {availablePlatforms.map(p => (
                <button key={p.id} className="add-platform-btn tooltip" data-tip={p.name} style={{ color: p.color }}>
                  <p.icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .accounts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-5);
        }

        .account-card {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .account-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .account-platform-icon {
          width: 42px; height: 42px;
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
        }

        .account-platform-icon[data-platform="youtube"] { background: rgba(255, 0, 0, 0.12); color: #FF4444; }
        .account-platform-icon[data-platform="facebook"] { background: rgba(24, 119, 242, 0.12); color: #60A5FA; }
        .account-platform-icon[data-platform="instagram"] { background: rgba(228, 64, 95, 0.12); color: #F472B6; }
        .account-platform-icon[data-platform="tiktok"] { background: rgba(0, 242, 234, 0.08); color: #00F2EA; }
        .account-platform-icon[data-platform="x"] { background: rgba(255, 255, 255, 0.06); color: #fff; }
        .account-platform-icon[data-platform="threads"] { background: rgba(255, 255, 255, 0.06); color: #fff; }

        .account-info {
          text-align: center;
        }

        .account-avatar {
          width: 56px; height: 56px; margin: 0 auto var(--space-3);
          border-radius: var(--radius-full);
          background: var(--glass-bg-active);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
        }

        .account-info h4 { margin-bottom: 2px; font-size: 0.9375rem; }

        .account-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: var(--space-3);
          border-top: 1px solid var(--glass-border);
        }

        .account-reconnect { margin-top: var(--space-1); }

        /* Add card */
        .add-card {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          border-style: dashed;
          min-height: 240px;
        }

        .add-card-icon {
          width: 56px; height: 56px; margin: 0 auto var(--space-4);
          border-radius: var(--radius-full);
          background: rgba(124, 58, 237, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-400);
        }

        .add-card h4 { margin-bottom: var(--space-1); }

        .add-card-platforms {
          display: flex; gap: var(--space-3);
          margin-top: var(--space-4);
        }

        .add-platform-btn {
          width: 36px; height: 36px;
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .add-platform-btn:hover {
          background: var(--glass-bg-hover);
          transform: translateY(-2px);
        }

        @media (max-width: 1024px) {
          .accounts-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .accounts-grid { grid-template-columns: 1fr; }
          .accounts-header { flex-direction: column; gap: var(--space-3); align-items: flex-start; }
        }
      `}</style>
    </>
  );
}
