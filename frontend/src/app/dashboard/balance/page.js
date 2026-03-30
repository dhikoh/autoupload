'use client';

import { useState, useEffect } from 'react';
import TopBar from '../../../components/TopBar';
import { topupAPI } from '@/lib/api';

export default function BalancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBalance(); }, []);

  async function loadBalance() {
    try {
      const res = await topupAPI.balance();
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <>
      <TopBar title="Saldo & Transaksi" />
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '200px' }}>
        <div style={styles.loading}>Loading...</div>
      </div>
    </>
  );

  return (
    <>
      <TopBar title="Saldo & Transaksi" />
      <div className="page-content">
        <div style={styles.container}>
          <div style={styles.balanceCard}>
            <p style={styles.balanceLabel}>Saldo Anda</p>
            <h2 style={styles.balanceAmount}>
              Rp {(data?.balance ?? 0).toLocaleString('id-ID')}
            </h2>
          </div>

          <h2 style={styles.sectionTitle}>📋 Riwayat Transaksi</h2>

          {(data?.transactions || []).length === 0 ? (
            <p style={styles.empty}>Belum ada transaksi</p>
          ) : (
            data.transactions.map(tx => (
              <div key={tx.id} style={styles.txItem}>
                <div style={styles.txLeft}>
                  <span style={styles.txIcon}>
                    {tx.type === 'topup' ? '💳'
                      : tx.type === 'deduct' ? '📤'
                      : tx.type === 'manual_add' ? '🎁'
                      : '↩️'}
                  </span>
                  <div>
                    <p style={styles.txDesc}>{tx.description || tx.type}</p>
                    <p style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div style={styles.txRight}>
                  <span style={{ ...styles.txAmount, color: tx.amount >= 0 ? '#22c55e' : '#ef4444' }}>
                    {tx.amount >= 0 ? '+' : ''}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
                  </span>
                  <span style={styles.txBalance}>
                    Saldo: Rp {tx.balance_after.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' },
  balanceCard: { background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2rem', textAlign: 'center', marginBottom: '2rem' },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', margin: '0 0 0.5rem', fontSize: '0.9rem' },
  balanceAmount: { color: '#fff', margin: 0, fontSize: '2.5rem', fontWeight: 700 },
  sectionTitle: { color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' },
  txItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(30,30,60,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: '0.5rem' },
  txLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  txIcon: { fontSize: '1.5rem' },
  txDesc: { color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' },
  txDate: { color: 'rgba(255,255,255,0.4)', margin: '0.15rem 0 0', fontSize: '0.75rem' },
  txRight: { textAlign: 'right' },
  txAmount: { display: 'block', fontWeight: 700, fontSize: '1rem' },
  txBalance: { color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' },
};
