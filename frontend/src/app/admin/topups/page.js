'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import '../admin.css';

export default function AdminTopupsPage() {
  const [topups, setTopups] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { loadTopups(); }, [statusFilter]);

  async function loadTopups() {
    try {
      const data = await adminAPI.topups({ status: statusFilter || undefined, limit: 100 });
      setTopups(data.topups || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleReview(action) {
    if (!reviewModal) return;
    try {
      await adminAPI.reviewTopup(reviewModal.id, action, reviewNote);
      setMsg(`Top-up ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      setReviewModal(null);
      setReviewNote('');
      loadTopups();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>💳 Top-Up Requests</h1>
        <p>{total} requests</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="admin-section">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['pending', 'approved', 'rejected', ''].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Amount</th>
                <th>Bukti</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topups.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.8rem' }}>{t.user_id.substring(0, 8)}...</td>
                  <td><strong>Rp {t.amount.toLocaleString('id-ID')}</strong></td>
                  <td>
                    {t.proof_file_name ? (
                      <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>📎 {t.proof_file_name}</span>
                    ) : '-'}
                  </td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td>{t.admin_note || '-'}</td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="btn btn-sm btn-primary"
                        onClick={() => setReviewModal(t)}>Review</button>
                    )}
                  </td>
                </tr>
              ))}
              {topups.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  Tidak ada request top-up
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Top-Up</h2>
              <button className="modal-close" onClick={() => setReviewModal(null)}>&times;</button>
            </div>
            <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
              <p><strong>Amount:</strong> Rp {reviewModal.amount.toLocaleString('id-ID')}</p>
              <p><strong>Bukti:</strong> {reviewModal.proof_file_name || 'Tidak ada'}</p>
              <p><strong>Tanggal:</strong> {new Date(reviewModal.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div className="form-group">
              <label>Catatan (opsional)</label>
              <input type="text" className="form-input" placeholder="Catatan admin..."
                value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => handleReview('reject')}>❌ Reject</button>
              <button className="btn btn-success" onClick={() => handleReview('approve')}>✅ Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
