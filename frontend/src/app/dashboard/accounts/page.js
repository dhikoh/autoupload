'use client';
import { useState, useEffect } from 'react';
import TopBar from '../../../components/TopBar';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon as XBrandIcon, ThreadsIcon } from '../../../components/PlatformBadge';
import { Link2, Plus, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { accountsAPI } from '@/lib/api';

const platformMeta = {
  youtube: { name: 'YouTube', icon: YouTubeIcon, color: '#FF0000' },
  facebook: { name: 'Facebook', icon: FacebookIcon, color: '#1877F2' },
  instagram: { name: 'Instagram', icon: InstagramIcon, color: '#E1306C' },
  tiktok: { name: 'TikTok', icon: TikTokIcon, color: '#00F2EA' },
  x: { name: 'X (Twitter)', icon: XBrandIcon, color: '#FFFFFF' },
  threads: { name: 'Threads', icon: ThreadsIcon, color: '#FFFFFF' },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try {
      const data = await accountsAPI.list();
      setAccounts(data || []);
    } catch {} finally { setLoading(false); }
  }

  const connectedIds = accounts.map(a => a.platform);

  async function handleConnect(platformId) {
    setConnecting(platformId);
    try {
      await accountsAPI.connect({
        platform: platformId,
        profile_name: `My ${platformMeta[platformId]?.name || platformId} Account`,
      });
      await loadAccounts();
    } catch {} finally { setConnecting(null); }
  }

  async function handleDisconnect(account) {
    setDisconnecting(account.id);
    try {
      await accountsAPI.disconnect(account.id);
      setAccounts(prev => prev.filter(a => a.id !== account.id));
    } catch {} finally { setDisconnecting(null); }
  }

  return (
    <>
      <TopBar title="Connected Accounts" />
      <div className="page-content">
        <div className="accounts-header animate-fade-in">
          <div>
            <h2>Your Platforms</h2>
            <p className="text-sm text-secondary">{accounts.length} of 6 platforms connected</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
          </div>
        ) : (
          <div className="accounts-grid animate-fade-in-up">
            {Object.entries(platformMeta).map(([id, meta]) => {
              const account = accounts.find(a => a.platform === id);
              const connected = !!account;
              const IconComp = meta.icon;
              return (
                <div key={id} className={`account-card neuglass-card-static ${connected ? 'connected' : ''}`}>
                  <div className="account-card-top">
                    <div className="account-icon" style={{ background: connected ? `${meta.color}20` : 'var(--bg-primary)' }}>
                      <IconComp size={24} />
                    </div>
                    <div className="account-info">
                      <h4>{meta.name}</h4>
                      {connected ? (
                        <span className="text-sm" style={{ color: 'var(--success-400)' }}>
                          {account.profile_name || 'Connected'}
                        </span>
                      ) : (
                        <span className="text-sm text-tertiary">Not connected</span>
                      )}
                    </div>
                    <span className={`badge ${connected ? 'badge-success' : 'badge-info'}`}>
                      {connected ? 'Active' : 'Available'}
                    </span>
                  </div>
                  <div className="account-card-actions">
                    {connected ? (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDisconnect(account)}
                        disabled={disconnecting === account.id}>
                        {disconnecting === account.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Disconnect
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleConnect(id)}
                        disabled={connecting === id}>
                        {connecting === id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .accounts-header { margin-bottom: var(--space-6); }
        .accounts-header h2 { margin-bottom: var(--space-1); }
        .accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-5); }
        .account-card { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
        .account-card.connected { border-color: rgba(34, 197, 94, 0.15); }
        .account-card-top { display: flex; align-items: center; gap: var(--space-4); }
        .account-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--neu-shadow-in-sm); flex-shrink: 0; }
        .account-info { flex: 1; }
        .account-info h4 { font-size: 0.9375rem; margin-bottom: 2px; }
        .account-card-actions { display: flex; justify-content: flex-end; }
        @media (max-width: 768px) { .accounts-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
