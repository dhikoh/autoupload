'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '../admin.css';

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDesc, setBalanceDesc] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  async function loadUsers() {
    try {
      const data = await adminAPI.users({ search, role: roleFilter, limit: 100 });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSuspend(userId) {
    if (!confirm('Suspend/unsuspend user ini?')) return;
    try {
      await adminAPI.toggleSuspend(userId);
      loadUsers();
    } catch (err) { alert(err.message); }
  }

  async function handleAddBalance() {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) return;
    try {
      await adminAPI.addBalance(balanceModal, parseFloat(balanceAmount), balanceDesc);
      setMsg('Saldo berhasil ditambahkan');
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceDesc('');
      loadUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>👥 User Management</h1>
        <p>{total} users total</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="admin-section">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input type="text" className="form-input" placeholder="Cari nama/email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }} />
          <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '150px' }}>
            <option value="">All Roles</option>
            <option value="tenant">Tenant</option>
            <option value="staff">Staff</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Balance</th>
                <th>Posts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>Rp {u.balance.toLocaleString('id-ID')}</td>
                  <td>{u.total_posts}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-active' : 'badge-suspended'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {isAdmin && u.role === 'tenant' && (
                      <>
                        <button className="btn btn-sm btn-primary"
                          onClick={() => setBalanceModal(u.id)}>+ Saldo</button>
                        <button className="btn btn-sm btn-danger"
                          onClick={() => handleSuspend(u.id)}>
                          {u.is_active ? 'Suspend' : 'Unsuspend'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {balanceModal && (
        <div className="modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Saldo Manual</h2>
              <button className="modal-close" onClick={() => setBalanceModal(null)}>&times;</button>
            </div>
            <div className="admin-form">
              <div className="form-group">
                <label>Jumlah (Rp)</label>
                <input type="number" className="form-input" placeholder="50000"
                  value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Keterangan (opsional)</label>
                <input type="text" className="form-input" placeholder="Manual top-up"
                  value={balanceDesc} onChange={e => setBalanceDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setBalanceModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAddBalance}>Tambah Saldo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
