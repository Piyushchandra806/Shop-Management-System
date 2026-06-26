'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = `/api/customers?search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Expand row to show order history
  const handleToggleExpand = async (customerId) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      return;
    }

    setExpandedCustomerId(customerId);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePrintStatement = (customerId) => {
    window.open(`/customers/print/${customerId}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles and view their print history"
      />

      {/* Control bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '500px', marginBottom: '8px' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by customer name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-ghost">🔍 Search</button>
      </form>

      {loading ? (
        <div className="skeleton glass-card" style={{ height: '300px', width: '100%' }} />
      ) : (
        <div className="glass-card" style={{ padding: '24px' }}>
          {customers.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem' }}>👥</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>No customers found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {customers.map((customer) => {
                const isExpanded = expandedCustomerId === customer.id;
                return (
                  <div key={customer.id} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: isExpanded ? 'var(--accent-primary-glow)' : 'transparent',
                    overflow: 'hidden',
                    transition: 'var(--transition)'
                  }}>
                    {/* Primary summary row */}
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleToggleExpand(customer.id)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{customer.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {customer.phone}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Jobs</span>
                          <span className="badge badge-new" style={{ fontSize: '0.8rem', padding: '2px 10px', marginTop: '4px' }}>
                            {customer._count?.orders || 0} Orders
                          </span>
                        </div>
                        <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none', color: 'var(--text-muted)' }}>
                          ▶
                        </span>
                      </div>
                    </div>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <div style={{
                        padding: '20px',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)'
                      }}>
                        {/* Profile details + Print Statement button row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                          <h4 style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            margin: 0
                          }}>
                            📋 Profile Details
                          </h4>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintStatement(customer.id);
                            }}
                            style={{ borderRadius: '8px' }}
                          >
                            🖨️ Print Statement
                          </button>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '16px',
                          marginBottom: '24px'
                        }}>
                          {customer.email && (
                            <div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                display: 'block',
                                marginBottom: '4px'
                              }}>Email Address</span>
                              <span style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                fontWeight: 600
                              }}>{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                display: 'block',
                                marginBottom: '4px'
                              }}>Shop Address</span>
                              <span style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                fontWeight: 600
                              }}>{customer.address}</span>
                            </div>
                          )}
                          {customer.notes && (
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                display: 'block',
                                marginBottom: '4px'
                              }}>Extra Details / Notes</span>
                              <span style={{
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                color: 'var(--text-primary)',
                                fontWeight: 500
                              }}>&quot;{customer.notes}&quot;</span>
                            </div>
                          )}
                        </div>

                        <h4 style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '12px',
                          marginTop: '4px'
                        }}>
                          📦 Order History
                        </h4>

                        {loadingOrders ? (
                          <div className="skeleton" style={{ height: '100px', width: '100%' }} />
                        ) : customerOrders.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orders recorded for this customer.</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Order Number</th>
                                  <th>Items Ordered</th>
                                  <th>Placed Date</th>
                                  <th>Delivery Date</th>
                                  <th>Status</th>
                                  <th className="text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerOrders.map(order => (
                                  <tr key={order.id}>
                                    <td>
                                      <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>
                                        {order.orderNumber}
                                      </Link>
                                    </td>
                                    <td>
                                      {order.items && order.items.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          {order.items.map((item, idx) => (
                                            <span key={idx} style={{ fontSize: '0.85rem' }}>
                                              {item.quantity}× {item.description}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items</span>
                                      )}
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>{new Date(order.deliveryDate).toLocaleDateString('en-IN')}</td>
                                    <td>
                                      <StatusBadge status={order.status} />
                                    </td>
                                    <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      ₹{order.totalAmount}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
