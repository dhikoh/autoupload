'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '../admin.css';

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const data = await adminAPI.getSettings();
      setSettings(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await adminAPI.updateSettings(settings);
      setSettings(updated);
      setMsg('Settings berhasil disimpan');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  function updateField(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  if (!isAdmin) return <div className="admin-loading">Akses ditolak</div>;
  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ App Settings</h1>
        <p>Konfigurasi harga, rekening, dan customer service</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="admin-section">
        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>💰 Pricing</h2>
        <div className="admin-form">
          <div className="form-group">
            <label>Harga per Upload (Rp)</label>
            <input type="number" className="form-input"
              value={settings.upload_price || ''}
              onChange={e => updateField('upload_price', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>🏦 Rekening Bank</h2>
        <div className="admin-form">
          <div className="form-group">
            <label>Nama Bank</label>
            <input type="text" className="form-input" placeholder="BCA"
              value={settings.bank_name || ''}
              onChange={e => updateField('bank_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nomor Rekening</label>
            <input type="text" className="form-input" placeholder="1234567890"
              value={settings.bank_account || ''}
              onChange={e => updateField('bank_account', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Atas Nama</label>
            <input type="text" className="form-input" placeholder="PT AutoPost Hub"
              value={settings.bank_holder || ''}
              onChange={e => updateField('bank_holder', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>📞 Customer Service</h2>
        <div className="admin-form">
          <div className="form-group">
            <label>WhatsApp (62xxx format)</label>
            <input type="text" className="form-input" placeholder="6281234567890"
              value={settings.cs_whatsapp || ''}
              onChange={e => updateField('cs_whatsapp', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Support</label>
            <input type="text" className="form-input" placeholder="support@autoposthub.com"
              value={settings.cs_email || ''}
              onChange={e => updateField('cs_email', e.target.value)} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}
        style={{ marginTop: '0.5rem' }}>
        {saving ? 'Menyimpan...' : '💾 Simpan Settings'}
      </button>
    </div>
  );
}
