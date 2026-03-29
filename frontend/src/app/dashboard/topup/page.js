'use client';

import { useState, useEffect } from 'react';
import { topupAPI, settingsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function TopUpPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const presets = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [settingsData, topupsData] = await Promise.all([
        settingsAPI.getPublic(),
        topupAPI.list(),
      ]);
      setSettings(settingsData);
      setTopups(topupsData.topups || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) return setError('Masukkan jumlah top-up');
    if (!proofFile) return setError('Upload bukti transfer');

    setSubmitting(true);
    try {
      await topupAPI.create(parseFloat(amount), proofFile);
      setMsg('Top-up request berhasil dikirim. Menunggu verifikasi admin.');
      setAmount('');
      setProofFile(null);
      loadData();
      setTimeout(() => setMsg(''), 5000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  const uploadPrice = parseFloat(settings.upload_price || 1000);
  const estimateUploads = amount ? Math.floor(parseFloat(amount) / uploadPrice) : 0;

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💳 Top-Up Saldo</h1>
      <p style={styles.subtitle}>Saldo saat ini: <strong>Rp {(user?.balance || 0).toLocaleString('id-ID')}</strong></p>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* Bank Info */}
      <div style={styles.bankCard}>
        <h3 style={styles.bankTitle}>🏦 Transfer ke:</h3>
        <p style={styles.bankInfo}><strong>{settings.bank_name}</strong></p>
        <p style={styles.bankNumber}>{settings.bank_account}</p>
        <p style={styles.bankHolder}>a/n {settings.bank_holder}</p>
      </div>

      {/* Top-Up Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Jumlah Top-Up (Rp)</label>
          <div style={styles.presets}>
            {presets.map(p => (
              <button key={p} type="button"
                style={{ ...styles.presetBtn, ...(parseInt(amount) === p ? styles.presetBtnActive : {}) }}
                onClick={() => setAmount(p.toString())}>
                Rp {p.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
          <input type="number" style={styles.input} placeholder="Atau masukkan jumlah lain"
            value={amount} onChange={e => setAmount(e.target.value)} />
          {amount && (
            <p style={styles.estimate}>≈ {estimateUploads} upload (@ Rp {uploadPrice.toLocaleString('id-ID')}/upload)</p>
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>📎 Bukti Transfer</label>
          <input type="file" accept="image/*,.pdf"
            onChange={e => setProofFile(e.target.files?.[0] || null)}
            style={styles.fileInput} />
        </div>

        <button type="submit" disabled={submitting} style={styles.submitBtn}>
          {submitting ? 'Mengirim...' : '🚀 Kirim Request Top-Up'}
        </button>
      </form>

      {/* CS Contact */}
      <div style={styles.csCard}>
        <h3 style={styles.csTitle}>📞 Butuh bantuan?</h3>
        <p style={styles.csText}>
          WhatsApp: <a href={`https://wa.me/${settings.cs_whatsapp}`} target="_blank"
            style={styles.csLink}>+{settings.cs_whatsapp}</a>
        </p>
        <p style={styles.csText}>
          Email: <a href={`mailto:${settings.cs_email}`} style={styles.csLink}>{settings.cs_email}</a>
        </p>
      </div>

      {/* History */}
      {topups.length > 0 && (
        <div style={styles.historySection}>
          <h2 style={styles.historyTitle}>📋 Riwayat Top-Up</h2>
          {topups.map(t => (
            <div key={t.id} style={styles.historyItem}>
              <div>
                <strong>Rp {t.amount.toLocaleString('id-ID')}</strong>
                <span style={{ ...styles.badge,
                  backgroundColor: t.status === 'approved' ? 'rgba(34,197,94,0.15)' :
                    t.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: t.status === 'approved' ? '#22c55e' :
                    t.status === 'rejected' ? '#ef4444' : '#f59e0b',
                }}>{t.status}</span>
              </div>
              <span style={styles.historyDate}>{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' },
  loading: { display: 'flex', justifyContent: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' },
  title: { color: '#fff', margin: '0 0 0.5rem', fontSize: '1.6rem' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' },
  success: { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem' },
  error: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem' },
  bankCard: { background: 'rgba(30,30,60,0.6)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' },
  bankTitle: { color: '#a5b4fc', margin: '0 0 0.75rem', fontSize: '1rem' },
  bankInfo: { color: '#fff', margin: '0 0 0.25rem' },
  bankNumber: { color: '#fbbf24', fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0', letterSpacing: 2 },
  bankHolder: { color: 'rgba(255,255,255,0.5)', margin: 0 },
  form: { background: 'rgba(30,30,60,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' },
  fieldGroup: { marginBottom: '1rem' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' },
  presets: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' },
  presetBtn: { padding: '0.5rem 1rem', background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
  presetBtnActive: { borderColor: '#6366f1', color: '#a5b4fc', background: 'rgba(99,102,241,0.1)' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' },
  estimate: { color: '#22c55e', fontSize: '0.85rem', marginTop: '0.5rem' },
  fileInput: { color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' },
  submitBtn: { width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
  csCard: { background: 'rgba(30,30,60,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem' },
  csTitle: { color: '#fff', margin: '0 0 0.5rem', fontSize: '0.95rem' },
  csText: { color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0', fontSize: '0.9rem' },
  csLink: { color: '#a5b4fc', textDecoration: 'none' },
  historySection: { marginTop: '1rem' },
  historyTitle: { color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(30,30,60,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: '0.5rem' },
  badge: { padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, marginLeft: '0.5rem' },
  historyDate: { color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' },
};
