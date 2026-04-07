'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Ban, Eye, Trash2, Plus, RefreshCw, Mail, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { securityAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const EVENT_TYPE_LABELS = {
  login_lockout:      { label: 'Brute Force', color: '#ef4444', icon: '🔐' },
  auto_block_ip:      { label: 'Auto-Block IP', color: '#f97316', icon: '🚫' },
  manual_block_ip:    { label: 'Manual Block', color: '#3b82f6', icon: '🛡️' },
  unblock_ip:         { label: 'Unblock IP', color: '#10b981', icon: '✅' },
  register_spam:      { label: 'Register Spam', color: '#8b5cf6', icon: '📋' },
  rate_limit_exceeded:{ label: 'Rate Limit', color: '#eab308', icon: '⚡' },
};

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('blocked'); // blocked | events
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  // Block IP form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockIP, setBlockIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('24');

  // Test email
  const [testEmailStatus, setTestEmailStatus] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role === 'tenant') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadBlockedIPs = useCallback(async () => {
    try {
      const data = await securityAPI.listBlockedIPs({ limit: 100 });
      setBlockedIPs(data);
    } catch (err) {
      console.error('Failed to load blocked IPs:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const data = await securityAPI.listEvents({ limit: 100 });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load security events:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadBlockedIPs(), loadEvents()]);
      setLoading(false);
    }
    init();
  }, [loadBlockedIPs, loadEvents]);

  async function handleBlockIP(e) {
    e.preventDefault();
    if (!blockIP.trim()) return;
    setActionLoading('block');
    try {
      await securityAPI.blockIP(
        blockIP.trim(),
        blockReason || 'Manual block by admin',
        blockDuration ? parseInt(blockDuration) : null,
      );
      setBlockIP(''); setBlockReason(''); setBlockDuration('24');
      setShowBlockForm(false);
      await loadBlockedIPs();
    } catch (err) {
      alert(err.message || 'Gagal memblokir IP');
    } finally {
      setActionLoading('');
    }
  }

  async function handleUnblock(id, ip) {
    if (!confirm(`Unblock IP ${ip}?`)) return;
    setActionLoading(id);
    try {
      await securityAPI.unblockIP(id);
      await loadBlockedIPs();
    } catch (err) {
      alert(err.message || 'Gagal unblock IP');
    } finally {
      setActionLoading('');
    }
  }

  async function handleTestEmail() {
    setTestEmailStatus('sending');
    try {
      const res = await securityAPI.testEmail();
      setTestEmailStatus('sent');
      setTimeout(() => setTestEmailStatus(''), 3000);
    } catch (err) {
      setTestEmailStatus('error');
      setTimeout(() => setTestEmailStatus(''), 3000);
      alert(err.message || 'SMTP tidak dikonfigurasi');
    }
  }

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function isExpired(dt) {
    if (!dt) return false;
    return new Date(dt) < new Date();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={32} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield size={24} color="#7c3aed" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Security Center</h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>IP Blocklist & Security Audit Log</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleTestEmail} disabled={testEmailStatus === 'sending'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: testEmailStatus === 'sent' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              color: testEmailStatus === 'sent' ? '#10b981' : '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            <Mail size={14} />
            {testEmailStatus === 'sending' ? 'Mengirim...' :
              testEmailStatus === 'sent' ? '✓ Terkirim' :
              testEmailStatus === 'error' ? '✗ Gagal' :
              'Test Email'}
          </button>
          <button onClick={() => { loadBlockedIPs(); loadEvents(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'IP Terblokir', value: blockedIPs.length, color: '#ef4444', icon: <Ban size={18} /> },
          { label: 'Security Events', value: events.length, color: '#f97316', icon: <AlertTriangle size={18} /> },
          { label: 'Brute Force', value: events.filter(e => e.event_type === 'login_lockout').length, color: '#eab308', icon: <Shield size={18} /> },
          { label: 'Auto-Blocked', value: blockedIPs.filter(b => b.is_auto_blocked).length, color: '#8b5cf6', icon: <Shield size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: s.color }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['blocked', <Ban size={14} />, 'IP Blocklist'], ['events', <Eye size={14} />, 'Audit Log']].map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none',
              background: tab === t ? 'rgba(124,58,237,0.3)' : 'transparent',
              color: tab === t ? '#a78bfa' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── IP Blocklist Tab ── */}
      {tab === 'blocked' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{blockedIPs.length} IP terblokir aktif</span>
            <button onClick={() => setShowBlockForm(!showBlockForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 8, color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Block IP Baru
            </button>
          </div>

          {/* Block IP form */}
          {showBlockForm && (
            <form onSubmit={handleBlockIP} style={{
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 12, padding: '20px', marginBottom: 16,
              display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'end',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>IP Address *</label>
                <input value={blockIP} onChange={e => setBlockIP(e.target.value)}
                  placeholder="1.2.3.4 atau ::1"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '9px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Alasan</label>
                <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  placeholder="Opsional"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '9px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Durasi (jam)</label>
                <input value={blockDuration} onChange={e => setBlockDuration(e.target.value)}
                  placeholder="0 = permanen"
                  type="number" min="0"
                  style={{ width: 110, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '9px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <button type="submit" disabled={actionLoading === 'block'}
                style={{ padding: '9px 18px', background: '#ef4444', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {actionLoading === 'block' ? '...' : 'Blokir'}
              </button>
            </form>
          )}

          {/* IP list */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {blockedIPs.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                <Shield size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Tidak ada IP yang diblokir saat ini</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['IP Address', 'Alasan', 'Tipe', 'Diblokir pada', 'Berakhir', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockedIPs.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ color: '#a78bfa', fontSize: 13, background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 4 }}>{b.ip_address}</code>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13, maxWidth: 200 }}>{b.reason || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                          background: b.is_auto_blocked ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          color: b.is_auto_blocked ? '#ef4444' : '#60a5fa' }}>
                          {b.is_auto_blocked ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(b.blocked_at)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        {b.expires_at ? (
                          <span style={{ color: isExpired(b.expires_at) ? '#64748b' : '#f97316' }}>
                            {isExpired(b.expires_at) ? '(kadaluarsa)' : formatDate(b.expires_at)}
                          </span>
                        ) : <span style={{ color: '#ef4444' }}>Permanen</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleUnblock(b.id, b.ip_address)} disabled={actionLoading === b.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 6, color: '#10b981', fontSize: 12, cursor: 'pointer' }}>
                          <CheckCircle size={12} /> {actionLoading === b.id ? '...' : 'Unblock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === 'events' && (
        <div>
          <div style={{ marginBottom: 16, color: '#94a3b8', fontSize: 14 }}>{events.length} events tercatat</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {events.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                <Eye size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Belum ada security events</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Event', 'IP', 'Email', 'Detail', 'Notif', 'Waktu'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const meta = EVENT_TYPE_LABELS[ev.event_type] || { label: ev.event_type, color: '#94a3b8', icon: '🔔' };
                    return (
                      <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                            background: `${meta.color}18`, color: meta.color }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {ev.ip_address
                            ? <code style={{ color: '#a78bfa', fontSize: 12, background: 'rgba(124,58,237,0.1)', padding: '2px 6px', borderRadius: 4 }}>{ev.ip_address}</code>
                            : <span style={{ color: '#475569' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{ev.email || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 11, maxWidth: 240,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={ev.details}>{ev.details || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {ev.admin_notified
                            ? <CheckCircle size={14} color="#10b981" />
                            : <XCircle size={14} color="#475569" />}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(ev.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
