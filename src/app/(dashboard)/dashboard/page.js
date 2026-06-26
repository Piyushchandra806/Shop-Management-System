'use client';

import { useState, useRef } from 'react';
import { usePoll } from '@/hooks/usePoll';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const [pendingPaymentsOrders, setPendingPaymentsOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const pendingModalRef = useRef(null);

  const [statsDetailTitle, setStatsDetailTitle] = useState('');
  const [statsDetailOrders, setStatsDetailOrders] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const statsModalRef = useRef(null);

  const handleOpenStatsModal = async (title, statusKey = null, operatorId = null) => {
    setStatsDetailTitle(title);
    setStatsDetailOrders([]);
    setLoadingDetail(true);
    statsModalRef.current?.showModal();

    try {
      let url = '/api/orders';
      if (operatorId) {
        url += `?operatorId=${operatorId}`;
      } else if (statusKey) {
        url += `?status=${statusKey}`;
      } else {
        let filter = '';
        if (title === 'Assigned Orders') {
          filter = 'assignedToday';
        } else if (title === 'My Pending Tasks') {
          filter = 'assignedPending';
        } else if (title === 'Completed Today') {
          filter = 'assignedCompletedToday';
        } else if (title === "Today's Orders") {
          filter = 'today';
        } else if (title === 'Pending Orders') {
          filter = 'pending';
        } else if (title === 'Monthly Revenue') {
          filter = 'monthlyRevenue';
        } else if (title === 'Pending Payments') {
          url += '?pendingPayments=true';
        }

        if (filter) {
          url += `?dashboardFilter=${filter}`;
        }
      }

      const res = await fetch(url);
      if (res.ok) {
        const ordersData = await res.json();
        setStatsDetailOrders(ordersData);
      }
    } catch (err) {
      console.error('Error fetching detail orders:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenPendingPayments = async () => {
    pendingModalRef.current?.showModal();
    setLoadingPending(true);
    try {
      const res = await fetch('/api/orders?pendingPayments=true');
      if (res.ok) {
        const ordersData = await res.json();
        setPendingPaymentsOrders(ordersData);
      }
    } catch (err) {
      console.error('Error fetching pending payments:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const { data, loading, error } = usePoll('/api/dashboard', 10000);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <PageHeader title="Dashboard" subtitle="Loading shop stats..." />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="skeleton skeleton-card glass-card" />
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          <div className="skeleton glass-card" style={{ height: '300px' }} />
          <div className="skeleton glass-card" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--accent-danger)' }}>
        <p style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{error}</p>
        <button className="btn btn-ghost" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { stats, ordersByStatus, recentOrders, lowStockItems } = data;
  const isOperator = stats.isOperator;

  const statCards = isOperator
    ? [
        { title: "Assigned Orders", value: stats.todayOrders, icon: '📋', color: 'var(--accent-primary)', glow: 'var(--shadow-glow-primary)' },
        { title: 'My Pending Tasks', value: stats.pendingOrders, icon: '⏳', color: 'var(--accent-warning)', glow: 'var(--shadow-glow-warning)' },
        { title: 'Completed Today', value: stats.completedToday, icon: '✅', color: 'var(--accent-success)', glow: 'var(--shadow-glow-success)' }
      ]
    : [
        { title: "Today's Orders", value: stats.todayOrders, icon: '📋', color: 'var(--accent-primary)', glow: 'var(--shadow-glow-primary)' },
        { title: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'var(--accent-warning)', glow: 'var(--shadow-glow-warning)' },
        { title: 'Monthly Revenue', value: stats.monthlyRevenue !== undefined ? `₹${stats.monthlyRevenue.toLocaleString('en-IN')}` : '₹0', icon: '💰', color: 'var(--accent-success)', glow: 'var(--shadow-glow-success)' },
        { title: 'Pending Payments', value: stats.pendingPayments !== undefined ? `₹${stats.pendingPayments.toLocaleString('en-IN')}` : '₹0', icon: '⚠️', color: 'var(--accent-danger)', glow: 'var(--shadow-glow-danger)' },
      ];

  const statusMap = {
    new: { label: 'New', color: 'var(--accent-primary)' },
    designing: { label: 'Designing', color: 'var(--accent-purple)' },
    printing: { label: 'Printing', color: 'var(--accent-warning)' },
    ready: { label: 'Ready', color: 'var(--accent-success)' },
    delivered: { label: 'Delivered', color: 'var(--text-muted)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Dashboard" 
        subtitle={isOperator ? "Your assigned print tasks overview" : "Overview of your print shop's activities today"}
        action={(
          <Link href="/orders?create=true" className="btn btn-primary">
            + New Order
          </Link>
        )}
      />

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px'
      }} className="animate-slide-up">
        {statCards.map((card, i) => {
          return (
            <div 
              key={i} 
              className="glass-card-hover"
              onClick={() => handleOpenStatsModal(card.title)}
              style={{
                padding: '24px',
                borderLeft: `4px solid ${card.color}`,
                boxShadow: `var(--shadow-md), ${card.glow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {card.title}
                </p>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                  {card.value}
                </h2>
              </div>
              <span style={{ fontSize: '2.5rem', opacity: 0.8 }}>{card.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Orders By Status Grid */}
      <div className="glass-card animate-slide-up stagger-1" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Orders Pipeline</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '16px'
        }}>
          {Object.keys(ordersByStatus).map((status) => (
            <div 
              key={status} 
              className="glass-card-hover" 
              onClick={() => handleOpenStatsModal((statusMap[status]?.label || status) + ' Stage', status)}
              style={{
                padding: '16px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: statusMap[status]?.color || 'gray',
                display: 'inline-block',
                marginRight: '8px'
              }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {statusMap[status]?.label || status}
              </p>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0 0 0' }}>
                {ordersByStatus[status]}
              </h4>
            </div>
          ))}
        </div>
      </div>

      {/* Tables Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isOperator ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }} className="animate-slide-up stagger-2">
        
        {/* Recent Orders */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <Link href="/orders" style={{ fontSize: '0.85rem' }}>View All →</Link>
          </div>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No orders found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order#</th>
                    <th>Customer</th>
                    <th>Status</th>
                    {!isOperator && <th className="text-right">Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} style={{ cursor: 'pointer' }}>
                      <td>
                        <Link href={`/orders/${order.id}`} style={{ fontWeight: 600 }}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="truncate" style={{ maxWidth: '140px' }}>{order.customer.name}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      {!isOperator && (
                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{order.totalAmount}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {!isOperator && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>⚠️ Low Stock Alerts</h3>
              <Link href="/inventory" style={{ fontSize: '0.85rem' }}>Manage Stock →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStockItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'var(--accent-success)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>✅</span>
                  <p style={{ margin: 0, fontWeight: 500 }}>All materials stock are at safe levels.</p>
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="glass-card" style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(244, 63, 94, 0.05)',
                    borderColor: 'rgba(244, 63, 94, 0.15)'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Min threshold: {item.minThreshold} {item.unit}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent-danger)', fontSize: '1.1rem' }}>
                        {item.quantity} {item.unit}
                      </p>
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: 'var(--accent-danger)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600
                      }}>
                        LOW STOCK
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Operator Activity Section (Admin Only) */}
      {!isOperator && data.operatorActivity && data.operatorActivity.length > 0 && (
        <div className="glass-card animate-slide-up stagger-3" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Operator Activity & Performance
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {data.operatorActivity.map((op) => (
              <div 
                key={op.operatorId} 
                className="glass-card-hover" 
                onClick={() => handleOpenStatsModal(`${op.operatorName}'s Orders`, null, op.operatorId)}
                style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {/* Operator Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {op.operatorName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Store Operator</span>
                  </div>
                  <div style={{
                    background: 'var(--accent-primary-glow)',
                    border: '1px solid var(--border-color-hover)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' }}>
                      {op.orderCount}
                    </span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Orders Taken
                    </span>
                  </div>
                </div>

                {/* Latest Orders List */}
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Recent Orders:
                  </p>
                  {op.latestOrders.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No orders taken yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {op.latestOrders.map((order) => (
                        <div key={order.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <div>
                            <Link 
                              href={`/orders/${order.id}`} 
                              onClick={(e) => e.stopPropagation()} 
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--accent-primary-hover)',
                                textDecoration: 'none'
                              }}
                            >
                              {order.orderNumber}
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {order.customer.name} • {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                                Items: {order.items.map(item => `${item.quantity}x ${item.description}`).join(', ')}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING PAYMENTS DIALOG MODAL */}
      <dialog ref={pendingModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '650px',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-danger)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Outstanding Dues / Pending Payments
          </h3>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => pendingModalRef.current?.close()}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingPending ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              Loading outstanding orders...
            </div>
          ) : pendingPaymentsOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No pending payments! All orders are fully paid. 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingPaymentsOrders.map(order => (
                <div 
                  key={order.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <Link 
                      href={`/orders/${order.id}`}
                      onClick={() => pendingModalRef.current?.close()}
                      style={{
                        fontWeight: 700,
                        color: 'var(--accent-primary-hover)',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                      }}
                    >
                      {order.orderNumber}
                    </Link>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {order.customer?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Phone: {order.customer?.phone}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Due Amount
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-danger)', marginTop: '2px' }}>
                      ₹{order.dueAmount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Total: ₹{order.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.2)'
        }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => pendingModalRef.current?.close()}
          >
            Close
          </button>
        </div>
      </dialog>

      {/* STATS DETAIL DIALOG MODAL */}
      <dialog ref={statsModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '750px',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 {statsDetailTitle}
          </h3>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => statsModalRef.current?.close()}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              Loading orders...
            </div>
          ) : statsDetailOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No orders found in this category.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {statsDetailOrders.map(order => (
                <div 
                  key={order.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link 
                        href={`/orders/${order.id}`}
                        onClick={() => statsModalRef.current?.close()}
                        style={{
                          fontWeight: 700,
                          color: 'var(--accent-primary-hover)',
                          textDecoration: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        {order.orderNumber}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {order.customer?.name}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <strong>Items:</strong> {order.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{order.totalAmount}
                    </div>
                    {order.dueAmount > 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>
                        Due: ₹{order.dueAmount}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                        Paid
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.2)'
        }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => statsModalRef.current?.close()}
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
