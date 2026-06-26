'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

export default function DuesPage() {
  const [data, setData] = useState({ summary: null, customers: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter !== 'all') params.set('filter', filter);

      const res = await fetch(`/api/dues?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDues();
  };

  const summary = data.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Dues & Defaulters"
        subtitle="Track customers with unpaid orders and outstanding balances"
      />

      {/* Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Total Due Amount */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              💰 Total Outstanding
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{summary.totalDueAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Defaulter Customers */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              👥 Customers With Dues
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {summary.totalDefaulters}
            </div>
          </div>

          {/* Zero-Paid Customers */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              🚫 Zero Payment Given
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {summary.totalZeroPaidCustomers}
            </div>
          </div>

          {/* Total Due Orders */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              📋 Unpaid Orders
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {summary.totalDueOrders}
            </div>
          </div>
        </div>
      )}

      {/* Controls — Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 300px', maxWidth: '500px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost">🔍</button>
        </form>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: 'All Dues' },
            { key: 'zero_paid', label: '🚫 Zero Paid' },
            { key: 'partial', label: '⚠️ Partial Paid' },
          ].map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dues List */}
      {loading ? (
        <div className="skeleton glass-card" style={{ height: '400px', width: '100%' }} />
      ) : data.customers.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>🎉</span>
          <h3 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>No Outstanding Dues!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All customers have cleared their payments. Great job!
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {data.customers.map((entry, idx) => {
            const c = entry.customer;
            const isExpanded = expandedId === c.id;

            return (
              <div key={c.id} style={{
                borderBottom: idx < data.customers.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  style={{
                    padding: '16px 24px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto',
                    gap: '20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    background: isExpanded ? 'var(--accent-primary-glow)' : 'transparent'
                  }}
                >
                  {/* Customer Name + Phone */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📞 {c.phone}
                    </div>
                  </div>

                  {/* Due Orders Count */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Due Orders
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {entry.dueOrders.length}
                    </div>
                  </div>

                  {/* Total Paid */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Paid
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                      ₹{entry.totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Total Due — highlighted in red */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Due
                    </div>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: '#EF4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ₹{entry.totalDue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <span style={{
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'none'
                  }}>
                    ▶
                  </span>
                </div>

                {/* Expanded: show individual due orders */}
                {isExpanded && (
                  <div style={{
                    padding: '0 24px 20px 24px',
                    background: 'var(--bg-tertiary)',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {/* Zero-paid warning */}
                    {entry.zeroPaidOrders > 0 && (
                      <div style={{
                        margin: '16px 0 12px 0',
                        padding: '10px 16px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.22)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#EF4444'
                      }}>
                        🚫 {entry.zeroPaidOrders} order{entry.zeroPaidOrders > 1 ? 's' : ''} with ZERO payment received
                      </div>
                    )}

                    <table className="table" style={{ marginTop: '8px' }}>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Items</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th className="text-right">Total</th>
                          <th className="text-right">Paid</th>
                          <th className="text-right" style={{ color: '#EF4444' }}>Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.dueOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <Link href={`/orders/${order.id}`} style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                {order.items.map((item, i) => (
                                  <span key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {item.quantity}× {item.description}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td>
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="text-right" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                              ₹{order.paidAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="text-right" style={{
                              fontWeight: 800,
                              color: order.paidAmount === 0 ? '#EF4444' : '#F59E0B'
                            }}>
                              ₹{order.dueAmount.toLocaleString('en-IN')}
                              {order.paidAmount === 0 && (
                                <span style={{
                                  display: 'block',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  color: '#EF4444',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}>
                                  NO PAYMENT
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Responsive grid */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .dues-summary-row {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
