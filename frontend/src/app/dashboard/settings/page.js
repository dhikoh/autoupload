'use client';
import TopBar from '../../../components/TopBar';
import {
  User, CreditCard, Bell, Key, Users,
  Camera, Save, Eye, EyeOff, Copy, Trash2, Plus,
  Check, Zap, Crown, Building2
} from 'lucide-react';
import { useState } from 'react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'team', label: 'Team', icon: Users },
];

const plans = [
  { name: 'Free', price: 'Rp 0', icon: Zap, current: false, features: ['3 platforms', '10 posts/mo', '1 account'] },
  { name: 'Starter', price: 'Rp 99K/mo', icon: Zap, current: true, features: ['5 platforms', '50 posts/mo', '3 accounts'] },
  { name: 'Pro', price: 'Rp 249K/mo', icon: Crown, current: false, features: ['All platforms', 'Unlimited', '10 accounts'] },
  { name: 'Agency', price: 'Rp 599K/mo', icon: Building2, current: false, features: ['Everything', 'Team', 'API'] },
];

const teamMembers = [
  { name: 'John Doe', email: 'john@example.com', role: 'Admin', avatar: 'JD' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'Member', avatar: 'JS' },
];

const apiKeys = [
  { name: 'Production', key: 'aph_live_xxxx...xxxx1234', created: 'Mar 15, 2026' },
  { name: 'Development', key: 'aph_test_xxxx...xxxx5678', created: 'Mar 20, 2026' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <TopBar title="Settings" />
      <div className="page-content">
        <div className="settings-layout">
          {/* Tabs */}
          <div className="settings-tabs glass-card-static">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="settings-content">
            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="settings-panel animate-fade-in">
                <div className="glass-card-static settings-section">
                  <h3>Profile Information</h3>
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      <span>U</span>
                      <button className="profile-avatar-edit">
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">Upload a photo (max 2MB)</p>
                    </div>
                  </div>
                  <div className="settings-form-grid">
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input className="input-field" type="text" defaultValue="User" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input className="input-field" type="email" defaultValue="user@example.com" readOnly style={{ opacity: 0.6 }} />
                    </div>
                  </div>
                  <button className="btn btn-primary"><Save size={14} /> Save Changes</button>
                </div>

                <div className="glass-card-static settings-section">
                  <h3>Change Password</h3>
                  <div className="settings-form-grid">
                    <div className="input-group">
                      <label className="input-label">Current Password</label>
                      <div className="input-password-wrapper">
                        <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                        <button className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">New Password</label>
                      <input className="input-field" type="password" placeholder="Min. 8 characters" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Confirm Password</label>
                      <input className="input-field" type="password" placeholder="Re-enter password" />
                    </div>
                  </div>
                  <button className="btn btn-primary"><Save size={14} /> Update Password</button>
                </div>
              </div>
            )}

            {/* Subscription */}
            {activeTab === 'subscription' && (
              <div className="settings-panel animate-fade-in">
                <div className="glass-card-static settings-section">
                  <h3>Current Plan</h3>
                  <div className="plan-cards">
                    {plans.map(plan => (
                      <div key={plan.name} className={`plan-card ${plan.current ? 'current' : ''}`}>
                        <plan.icon size={20} />
                        <h4>{plan.name}</h4>
                        <span className="plan-price">{plan.price}</span>
                        <ul>
                          {plan.features.map((f, i) => <li key={i}><Check size={12} /> {f}</li>)}
                        </ul>
                        <button className={`btn btn-sm w-full ${plan.current ? 'btn-secondary' : 'btn-outline'}`}>
                          {plan.current ? 'Current' : 'Upgrade'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card-static settings-section">
                  <h3>Usage</h3>
                  <div className="usage-bars">
                    <div className="usage-item">
                      <div className="usage-header">
                        <span>Posts</span><span className="text-sm">23 / 50</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: '46%' }} /></div>
                    </div>
                    <div className="usage-item">
                      <div className="usage-header">
                        <span>Accounts</span><span className="text-sm">2 / 3</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: '66%' }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="settings-panel animate-fade-in">
                <div className="glass-card-static settings-section">
                  <h3>Email Notifications</h3>
                  <div className="notification-list">
                    {[
                      { label: 'Upload completed', desc: 'Receive email when uploads finish', checked: true },
                      { label: 'Upload failed', desc: 'Get notified about failed uploads', checked: true },
                      { label: 'Weekly summary', desc: 'Weekly report of your post performance', checked: false },
                      { label: 'Product updates', desc: 'News about new features and improvements', checked: true },
                    ].map((item, i) => (
                      <div key={i} className="notification-item">
                        <div>
                          <span className="notification-label">{item.label}</span>
                          <span className="text-xs text-tertiary">{item.desc}</span>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={item.checked} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="settings-panel animate-fade-in">
                <div className="glass-card-static settings-section">
                  <div className="section-header-row">
                    <h3>API Keys</h3>
                    <button className="btn btn-primary btn-sm"><Plus size={14} /> Generate Key</button>
                  </div>
                  <div className="api-keys-list">
                    {apiKeys.map((key, i) => (
                      <div key={i} className="api-key-item">
                        <div className="api-key-info">
                          <span className="api-key-name">{key.name}</span>
                          <code className="api-key-value">{key.key}</code>
                          <span className="text-xs text-tertiary">Created {key.created}</span>
                        </div>
                        <div className="api-key-actions">
                          <button className="btn btn-ghost btn-sm"><Copy size={14} /> Copy</button>
                          <button className="btn btn-danger btn-sm"><Trash2 size={14} /> Revoke</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team */}
            {activeTab === 'team' && (
              <div className="settings-panel animate-fade-in">
                <div className="glass-card-static settings-section">
                  <div className="section-header-row">
                    <h3>Team Members</h3>
                    <button className="btn btn-primary btn-sm"><Plus size={14} /> Invite</button>
                  </div>
                  <div className="team-list">
                    {teamMembers.map((member, i) => (
                      <div key={i} className="team-item">
                        <div className="team-avatar">{member.avatar}</div>
                        <div className="team-info">
                          <span className="team-name">{member.name}</span>
                          <span className="text-xs text-tertiary">{member.email}</span>
                        </div>
                        <span className={`badge ${member.role === 'Admin' ? 'badge-info' : 'badge-success'}`}>{member.role}</span>
                        <button className="btn btn-ghost btn-icon btn-sm"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: var(--space-6);
        }

        .settings-tabs {
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          position: sticky;
          top: calc(var(--topbar-height) + var(--space-8));
          align-self: start;
        }

        .settings-tab {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border: none; background: transparent;
          color: var(--text-tertiary);
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem; font-weight: 500;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .settings-tab:hover { background: var(--glass-bg); color: var(--text-primary); }
        .settings-tab.active { background: rgba(124, 58, 237, 0.12); color: var(--text-primary); }

        .settings-panel {
          display: flex; flex-direction: column; gap: var(--space-5);
        }

        .settings-section {
          padding: var(--space-6);
          display: flex; flex-direction: column; gap: var(--space-5);
        }

        .settings-section h3 {
          font-size: 1rem;
        }

        .section-header-row {
          display: flex; align-items: center; justify-content: space-between;
        }

        .settings-form-grid {
          display: flex; flex-direction: column; gap: var(--space-4);
        }

        /* Profile */
        .profile-avatar-section {
          display: flex; align-items: center; gap: var(--space-4);
        }

        .profile-avatar {
          position: relative;
          width: 64px; height: 64px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 700; color: #fff;
        }

        .profile-avatar-edit {
          position: absolute;
          bottom: -2px; right: -2px;
          width: 24px; height: 24px;
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          border: 2px solid var(--bg-primary);
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }

        .input-password-wrapper {
          position: relative;
        }

        .input-password-wrapper .input-field { padding-right: 40px; }

        .password-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-tertiary);
          cursor: pointer;
        }

        /* Plan cards */
        .plan-cards {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);
        }

        .plan-card {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          display: flex; flex-direction: column; gap: var(--space-3);
          transition: all var(--transition-base);
        }

        .plan-card.current {
          border-color: var(--primary-500);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
        }

        .plan-card h4 { font-size: 0.9375rem; }
        .plan-price { font-size: 1.125rem; font-weight: 800; }

        .plan-card ul {
          display: flex; flex-direction: column; gap: var(--space-2);
        }

        .plan-card li {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 0.75rem; color: var(--text-secondary);
        }

        .plan-card li :global(svg) { color: var(--success-400); }

        /* Usage */
        .usage-bars {
          display: flex; flex-direction: column; gap: var(--space-5);
        }

        .usage-item { display: flex; flex-direction: column; gap: var(--space-2); }

        .usage-header {
          display: flex; justify-content: space-between;
          font-size: 0.8125rem; font-weight: 500;
        }

        /* Notifications */
        .notification-list {
          display: flex; flex-direction: column; gap: var(--space-1);
        }

        .notification-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .notification-item:hover { background: var(--glass-bg); }

        .notification-item > div:first-child {
          display: flex; flex-direction: column; gap: 2px;
        }

        .notification-label { font-size: 0.875rem; font-weight: 500; }

        /* API Keys */
        .api-keys-list {
          display: flex; flex-direction: column; gap: var(--space-3);
        }

        .api-key-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          gap: var(--space-4);
        }

        .api-key-info {
          display: flex; flex-direction: column; gap: 2px;
        }

        .api-key-name { font-size: 0.875rem; font-weight: 600; }

        .api-key-value {
          font-size: 0.75rem; color: var(--text-tertiary);
          font-family: 'Courier New', monospace;
        }

        .api-key-actions { display: flex; gap: var(--space-2); }

        /* Team */
        .team-list {
          display: flex; flex-direction: column; gap: var(--space-2);
        }

        .team-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .team-item:hover { background: var(--glass-bg); }

        .team-avatar {
          width: 36px; height: 36px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6875rem; font-weight: 700; color: #fff;
        }

        .team-info {
          flex: 1;
          display: flex; flex-direction: column;
        }

        .team-name { font-size: 0.875rem; font-weight: 500; }

        @media (max-width: 1024px) {
          .plan-cards { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-tabs {
            flex-direction: row;
            overflow-x: auto;
            position: static;
          }
          .settings-tab span { display: none; }
          .plan-cards { grid-template-columns: 1fr; }
          .api-key-item { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}
