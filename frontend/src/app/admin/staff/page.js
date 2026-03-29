'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '../admin.css';

export default function AdminStaffPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const data = await adminAPI.users({ role: 'staff', limit: 100 });
      setUsers(data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.email || !form.name || !form.password) return alert('Semua field wajib diisi');
    try {
      await adminAPI.createStaff(form);
      setMsg('Staff berhasil ditambahkan');
      setShowCreate(false);
      setForm({ email: '', name: '', password: '' });
      loadStaff();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus staff ini?')) return;
    try {
      await adminAPI.deleteStaff(id);
      setMsg('Staff berhasil dihapus');
      loadStaff();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.message); }
  }

  if (!isAdmin) return <div className="admin-loading">Akses ditolak</div>;
  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🛡️ Staff Management</h1>
        <p>Kelola akun staff admin</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Batal' : '+ Tambah Staff'}
        </button>
      </div>

      {showCreate && (
        <div className="admin-section">
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Buat Akun Staff</h2>
          <div className="admin-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" placeholder="staff@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nama</label>
              <input type="text" className="form-input" placeholder="Nama Staff"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-input" placeholder="Min 6 karakter"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-success" onClick={handleCreate}>✅ Buat Staff</button>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-active' : 'badge-suspended'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  Belum ada staff
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
