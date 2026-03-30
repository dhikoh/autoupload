'use client';

import { useState, useEffect } from 'react';
import TopBar from '../../../components/TopBar';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Bell, Shield } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'security', label: 'Keamanan', icon: Shield },
];

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) setName(user.name || '');
  }, [user]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!name.trim()) return setProfileError('Nama tidak boleh kosong');
    setProfileError('');
    setSavingProfile(true);
    try {
      await authAPI.updateProfile(name.trim());
      await checkAuth(); // Refresh user context with new name
      setProfileMsg('Profil berhasil diperbarui ✅');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) return setPwError('Semua field wajib diisi');
    if (newPw !== confirmPw) return setPwError('Password baru dan konfirmasi tidak sama');
    if (newPw.length < 6) return setPwError('Password minimal 6 karakter');

    setSavingPw(true);
    try {
      await authAPI.changePassword(currentPw, newPw);
      setPwMsg('Password berhasil diubah ✅');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <TopBar title="Pengaturan" />
      <div className="page-content">
        <div style={styles.container}>
          {/* Tab Navigation */}
          <div style={styles.tabs}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id}
                  style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
                  onClick={() => setActiveTab(tab.id)}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>👤 Informasi Profil</h2>
              {profileMsg && <div style={styles.success}>{profileMsg}</div>}
              {profileError && <div style={styles.error}>{profileError}</div>}
              <form onSubmit={handleSaveProfile}>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input type="email" style={{ ...styles.input, opacity: 0.5 }}
                    value={user?.email || ''} disabled />
                  <p style={styles.hint}>Email tidak dapat diubah</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Nama</label>
                  <input type="text" style={styles.input} value={name}
                    onChange={e => setName(e.target.value)} placeholder="Nama Anda" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Role</label>
                  <input type="text" style={{ ...styles.input, opacity: 0.5 }}
                    value={user?.role || ''} disabled />
                </div>
                <button type="submit" disabled={savingProfile} style={styles.btn}>
                  {savingProfile ? 'Menyimpan...' : '💾 Simpan Profil'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔒 Ganti Password</h2>
              {pwMsg && <div style={styles.success}>{pwMsg}</div>}
              {pwError && <div style={styles.error}>{pwError}</div>}
              <form onSubmit={handleChangePassword}>
                <div style={styles.field}>
                  <label style={styles.label}>Password Saat Ini</label>
                  <input type="password" style={styles.input} value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Password Baru</label>
                  <input type="password" style={styles.input} value={newPw}
                    onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 karakter" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Konfirmasi Password Baru</label>
                  <input type="password" style={styles.input} value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" />
                </div>
                <button type="submit" disabled={savingPw} style={styles.btn}>
                  {savingPw ? 'Menyimpan...' : '🔑 Ubah Password'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔔 Notifikasi</h2>
              <div style={styles.comingSoon}>
                <Bell size={48} style={{ opacity: 0.3 }} />
                <p>Pengaturan notifikasi akan segera hadir</p>
                <p style={styles.comingSoonSub}>
                  Email notifikasi saat upload selesai, top-up diproses, dll.
                </p>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🛡️ Keamanan Akun</h2>
              <div style={styles.securityItem}>
                <div>
                  <h3 style={styles.secTitle}>Sessions Aktif</h3>
                  <p style={styles.secDesc}>Token login berlaku 7 hari sejak login terakhir</p>
                </div>
              </div>
              <div style={styles.securityItem}>
                <div>
                  <h3 style={styles.secTitle}>Two-Factor Authentication (2FA)</h3>
                  <p style={styles.secDesc}>Akan segera hadir di versi berikutnya</p>
                </div>
                <span style={styles.comingSoonBadge}>Coming Soon</span>
              </div>
              <div style={styles.securityItem}>
                <div>
                  <h3 style={styles.secTitle}>API Access</h3>
                  <p style={styles.secDesc}>Manajemen API keys untuk integrasi pihak ketiga</p>
                </div>
                <span style={styles.comingSoonBadge}>Coming Soon</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { maxWidth: 640, margin: '0 auto' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'rgba(30,30,60,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' },
  tabActive: { background: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  card: { background: 'rgba(30,30,60,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2rem', backdropFilter: 'blur(10px)' },
  cardTitle: { color: '#fff', margin: '0 0 1.5rem', fontSize: '1.2rem' },
  success: { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem' },
  error: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem' },
  field: { marginBottom: '1rem' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: '0.25rem 0 0' },
  btn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '0.5rem' },
  comingSoon: { textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  comingSoonSub: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', margin: 0 },
  securityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  secTitle: { color: '#fff', margin: 0, fontSize: '0.95rem' },
  secDesc: { color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0', fontSize: '0.8rem' },
  comingSoonBadge: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' },
};
