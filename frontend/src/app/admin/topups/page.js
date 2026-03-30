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
  const [error, setError] = useState('');

  useEffect(() => { loadTopups(); }, [statusFilter]);

  async function loadTopups() {
    setLoading(true);
    try {
      const data = await adminAPI.topups({ status: statusFilter || undefined, limit: 100 });
      setTopups(data.topups || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleReview(action) {
    if (!reviewModal) return;
    setError('');
    try {
      await adminAPI.reviewTopup(reviewModal.id, action, reviewNote);
      setMsg(`Top-up ${action === 'approve' ? 'disetujui ✅' : 'ditolak ❌'}`);
      setReviewModal(null);
      setReviewNote('');
      loadTopups();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  function openProof(topup) {
    const url = `/api/admin/proofs/${topup.proof_file_name}`;
    window.open(url, '_blank');
  }

  if (loading) return <div className="admin-loading">Loading top-up requests...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>💳 Top-Up Requests</h1>
        <p>{total} requests total</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-section">
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { val: 'pending', label: '⏳ Pending' },
            { val: 'approved', label: '✅ Approved' },
            { val: 'rejected', label: '❌ Rejected' },
            { val: '', label: '🔎 All' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`btn btn-sm ${statusFilter === val ? 'btn-primary' : 'btn-outline'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
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
                  <td><strong>{t.user_name || 'Unknown'}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{t.user_email}</td>
                  <td><strong>Rp {t.amount.toLocaleString('id-ID')}</strong></td>
                  <td>
                    {t.proof_file_name ? (
                      <button className="btn btn-sm btn-outline"
                        onClick={() => openProof(t)}
                        title="Lihat bukti transfer">
                        📎 Lihat
                      </button>
                    ) : <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}
                  </td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{t.admin_note || '-'}</td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="btn btn-sm btn-primary"
                        onClick={() => setReviewModal(t)}>Review</button>
                    )}
                  </td>
                </tr>
              ))}
              {topups.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  Tidak ada request top-up
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Top-Up</h2>
              <button className="modal-close" onClick={() => setReviewModal(null)}>&times;</button>
            </div>
            <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}><strong>User:</strong> {reviewModal.user_name}</p>
              <p style={{ margin: 0 }}><strong>Email:</strong> {reviewModal.user_email}</p>
              <p style={{ margin: 0 }}><strong>Amount:</strong> Rp {reviewModal.amount.toLocaleString('id-ID')}</p>
              <p style={{ margin: 0 }}>
                <strong>Bukti:</strong>{' '}
                {reviewModal.proof_file_name ? (
                  <button className="btn btn-sm btn-outline" style={{ marginLeft: '0.5rem' }}
                    onClick={() => openProof(reviewModal)}>
                    📎 Lihat File
                  </button>
                ) : 'Tidak ada'}
              </p>
              <p style={{ margin: 0 }}><strong>Tanggal:</strong> {new Date(reviewModal.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div className="form-group">
              <label>Catatan (opsional)</label>
              <input type="text" className="form-input" placeholder="Catatan untuk user..."
                value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            </div>
            {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
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
