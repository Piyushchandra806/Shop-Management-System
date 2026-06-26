'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CustomerPrintStatement() {
  const params = useParams();
  const customerId = params.id;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) {
          setError('Failed to load customer data.');
          return;
        }
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        setError('An error occurred while loading customer data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (customerId) fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    if (customer && !loading) {
      // Small delay to allow render before triggering print
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [customer, loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <p style={{ color: '#86868b' }}>Loading statement...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <p style={{ color: '#ff3b30' }}>{error || 'Customer not found.'}</p>
      </div>
    );
  }

  const orders = customer.orders || [];
  const totalInvoiced = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  const printDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 32px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#1d1d1f',
        background: 'white',
        minHeight: '100vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid #e8e8ed',
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              🖨️ MayankComputer
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: '4px 0 0' }}>
              Printing Shop Management System
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0071e3' }}>
              ACCOUNT STATEMENT
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: '4px 0 0' }}>
              Date: {printDate}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px',
          padding: '20px',
          background: '#f5f5f7',
          borderRadius: '12px',
        }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 4px' }}>Customer Name</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1d1d1f' }}>{customer.name}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 4px' }}>Phone</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#1d1d1f' }}>{customer.phone}</p>
          </div>
          {customer.email && (
            <div>
              <p style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 4px' }}>Email</p>
              <p style={{ fontSize: '0.9rem', margin: 0, color: '#1d1d1f' }}>{customer.email}</p>
            </div>
          )}
          {customer.address && (
            <div>
              <p style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 4px' }}>Address</p>
              <p style={{ fontSize: '0.9rem', margin: 0, color: '#1d1d1f' }}>{customer.address}</p>
            </div>
          )}
        </div>

        {/* Summary Totals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            padding: '16px 20px',
            background: '#f5f5f7',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 6px' }}>Total Invoiced</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#1d1d1f' }}>₹{totalInvoiced.toLocaleString('en-IN')}</p>
          </div>
          <div style={{
            padding: '16px 20px',
            background: 'rgba(52, 199, 89, 0.08)',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(52, 199, 89, 0.15)',
          }}>
            <p style={{ fontSize: '0.7rem', color: '#248a3d', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 6px' }}>Total Paid</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#248a3d' }}>₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div style={{
            padding: '16px 20px',
            background: totalDue > 0 ? 'rgba(255, 59, 48, 0.06)' : 'rgba(52, 199, 89, 0.06)',
            borderRadius: '12px',
            textAlign: 'center',
            border: totalDue > 0 ? '1px solid rgba(255, 59, 48, 0.15)' : '1px solid rgba(52, 199, 89, 0.15)',
          }}>
            <p style={{ fontSize: '0.7rem', color: totalDue > 0 ? '#ff3b30' : '#248a3d', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 6px' }}>Balance Due</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: totalDue > 0 ? '#ff3b30' : '#248a3d' }}>₹{totalDue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Orders Table */}
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
          Order Details ({orders.length} {orders.length === 1 ? 'Order' : 'Orders'})
        </h3>

        {orders.length === 0 ? (
          <p style={{ color: '#86868b', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>No orders recorded for this customer.</p>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8e8ed' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Order #</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Items</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Date</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Amount</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Paid</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868b' }}>Due</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#1d1d1f' }}>{order.orderNumber}</td>
                  <td style={{ padding: '10px 8px', color: '#6e6e73' }}>
                    {order.items && order.items.length > 0
                      ? order.items.map((item, idx) => `${item.quantity}× ${item.description}`).join(', ')
                      : '—'
                    }
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6e6e73' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: order.status === 'delivered' ? 'rgba(142, 142, 147, 0.12)' :
                                  order.status === 'ready' ? 'rgba(52, 199, 89, 0.1)' :
                                  order.status === 'printing' ? 'rgba(255, 159, 10, 0.1)' :
                                  'rgba(0, 113, 227, 0.1)',
                      color: order.status === 'delivered' ? '#636366' :
                             order.status === 'ready' ? '#248a3d' :
                             order.status === 'printing' ? '#cc7d08' :
                             '#0071e3',
                    }}>{order.status}</span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#248a3d', fontWeight: 600 }}>₹{(order.paidAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: (order.dueAmount || 0) > 0 ? '#ff3b30' : '#248a3d' }}>₹{(order.dueAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #1d1d1f' }}>
                <td colSpan="4" style={{ padding: '12px 8px', fontWeight: 800, fontSize: '0.85rem' }}>TOTAL</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>₹{totalInvoiced.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: '#248a3d' }}>₹{totalPaid.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: totalDue > 0 ? '#ff3b30' : '#248a3d' }}>₹{totalDue.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          paddingTop: '20px',
          borderTop: '1px solid #e8e8ed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#86868b', margin: 0 }}>
              This is a computer-generated statement.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '2px 0 0' }}>
              Generated by MayankComputer • {printDate}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: '#86868b', margin: 0 }}>Authorized Signature</p>
            <div style={{ width: '150px', borderBottom: '1px solid #86868b', marginTop: '28px' }} />
          </div>
        </div>

        {/* Print Again Button (hidden in print) */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '12px 32px',
              background: '#0071e3',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            🖨️ Print Again
          </button>
        </div>
      </div>
    </>
  );
}
