'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PublicTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTrackingData() {
      try {
        const res = await fetch(`/api/public/track/${orderNumber}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Order number not recognized');
          }
          throw new Error('Failed to load tracking information');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error loading tracking details');
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      fetchTrackingData();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        padding: '20px',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</span>
          <p style={{ marginTop: '16px', fontWeight: 600 }}>Searching order registry...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        padding: '20px',
        color: 'var(--text-primary)'
      }}>
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: '40px 32px',
          textAlign: 'center',
          borderColor: 'var(--accent-danger)'
        }}>
          <span style={{ fontSize: '3.5rem' }}>❌</span>
          <h2 style={{ marginTop: '16px', fontSize: '1.25rem', fontWeight: 800 }}>Order Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
            {error || "The tracking code you entered doesn't match any registered print orders."}
          </p>
          <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            For help, contact the print shop directly with your receipt.
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'new', label: 'Order Received', icon: '📝' },
    { key: 'designing', label: 'Designing Layout', icon: '🎨' },
    { key: 'printing', label: 'Printing Press', icon: '🖨️' },
    { key: 'ready', label: 'Ready for Pickup', icon: '✅' },
    { key: 'delivered', label: 'Delivered', icon: '📦' }
  ];

  const currentStatusIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: 'var(--text-primary)'
    }}>
      <div className="glass-card animate-scale-in" style={{
        width: '100%',
        maxWidth: '650px',
        padding: '32px',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem' }}>🖨️</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px' }}>MayankComputer Live Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Track your printing order status in real time
          </p>
        </div>

        {/* Invoice reference summary card */}
        <div className="glass-card" style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Order ID</span>
            <div style={{ fontWeight: 800, color: 'var(--accent-primary-hover)' }}>{order.orderNumber}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', textAlign: 'right' }}>Customer Profile</span>
            <div style={{ fontWeight: 600, textAlign: 'right' }}>{order.customerFirstName}</div>
          </div>
        </div>

        {/* Status Stepper Progression Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', margin: 0 }}>
            Production Steps
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              const isPending = idx > currentStatusIndex;

              let circleBg = 'rgba(255, 255, 255, 0.05)';
              let circleBorder = '1px solid var(--border-color)';
              let textColor = 'var(--text-muted)';
              let iconOpacity = 0.4;

              if (isCompleted) {
                circleBg = 'rgba(16, 185, 129, 0.15)';
                circleBorder = '1px solid var(--accent-success)';
                textColor = 'var(--text-secondary)';
                iconOpacity = 0.8;
              } else if (isCurrent) {
                circleBg = 'rgba(99, 102, 241, 0.2)';
                circleBorder = '2px solid var(--accent-primary)';
                textColor = 'var(--text-primary)';
                iconOpacity = 1.0;
              }

              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Step status circle */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: circleBg,
                    border: circleBorder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    transition: 'var(--transition)'
                  }}>
                    <span style={{ opacity: iconOpacity }}>{isCompleted ? '✓' : step.icon}</span>
                  </div>

                  {/* Step details label */}
                  <div>
                    <span style={{
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '0.9rem',
                      color: textColor,
                      display: 'block'
                    }}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--accent-primary-hover)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Current status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order details summary list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', margin: 0 }}>
            Order details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                padding: '4px 0'
              }}>
                <span>{item.description}</span>
                <strong style={{ color: 'var(--text-primary)' }}>Qty: {item.quantity}</strong>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              padding: '12px 0 4px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span>Target Delivery Date</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </strong>
            </div>
          </div>
        </div>

        {/* Support disclaimer footer */}
        <div style={{
          marginTop: '32px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          For questions or updates, please call the printing shop.
        </div>
      </div>
    </div>
  );
}
