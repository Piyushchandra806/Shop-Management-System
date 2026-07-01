'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderPrintPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('Failed to fetch order details');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      // Small timeout to ensure DOM is fully rendered before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', color: '#666' }}>
        <p>Loading print slip details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>Error loading print slip</h2>
        <p>{error || 'Order not found'}</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.5'
    }}>
      {/* Print Slip Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800' }}>🖨️ MAYANK COMPUTER</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Shop Order Slip & Job Card</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#555' }}><strong>GSTIN:</strong> 22AAAAA0000A1Z5</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#1a365d' }}>{order.orderNumber}</h2>
          <span style={{ padding: '4px 8px', background: '#edf2f7', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
            Status: {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Date and Operator row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', fontSize: '14px', borderBottom: '1px dashed #ccc', paddingBottom: '15px' }}>
        <div>
          <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div>
          <strong>Target Delivery:</strong> {new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div>
          <strong>Assigned Operator:</strong> {order.assignedTo?.name || 'Unassigned'}
        </div>
        <div>
          <strong>Created By:</strong> {order.createdBy?.name || 'Admin'}
        </div>
      </div>

      {/* Customer Information Section */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px', color: '#2d3748' }}>👤 Customer Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
          <div><strong>Full Name:</strong> {order.customer.name}</div>
          <div><strong>Phone Number:</strong> {order.customer.phone}</div>
          {order.customer.email && <div><strong>Email Address:</strong> {order.customer.email}</div>}
          {order.customer.address && <div style={{ gridColumn: 'span 2' }}><strong>Billing / Delivery Address:</strong> {order.customer.address}</div>}
        </div>
      </div>

      {/* Order Items Table */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#2d3748' }}>🛍️ Ordered Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #cbd5e0' }}>Product / Description</th>
              <th style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'center', width: '80px' }}>Qty</th>
              <th style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'right', width: '120px' }}>Unit Price</th>
              <th style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'right', width: '120px' }}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '10px', border: '1px solid #cbd5e0' }}>
                  {item.product?.name ? <strong>{item.product.name}</strong> : null}
                  {item.product?.name ? <br /> : null}
                  <span style={{ fontSize: '13px', color: '#4a5568' }}>{item.description}</span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'right' }}>₹{item.unitPrice}</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e0', textAlign: 'right', fontWeight: '600' }}>₹{(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dues and Payment Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ width: '300px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Subtotal:</span>
            <span>₹{order.totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', color: 'green' }}>
            <span>Paid Amount:</span>
            <strong>₹{order.paidAmount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', borderBottom: '2px double #000' }}>
            <strong>Remaining Due:</strong>
            <strong style={{ color: order.dueAmount > 0 ? '#e53e3e' : '#2f855a' }}>₹{order.dueAmount}</strong>
          </div>
        </div>
      </div>

      {/* Special Instructions (if any) */}
      {order.specialInstructions && (
        <div style={{ marginBottom: '40px', padding: '12px', background: '#fffaf0', border: '1px solid #feebc8', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#dd6b20', fontSize: '14px' }}>⚠️ Special Instructions / Operator Notes</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#7b341e' }}>{order.specialInstructions}</p>
        </div>
      )}

      {/* Footer / Thank you */}
      <div style={{ textAlign: 'center', marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#718096' }}>
        <p style={{ margin: '0 0 5px 0' }}>Thank you for doing business with MayankComputer!</p>
        <p style={{ margin: 0 }}>This is a computer generated billing slip.</p>
      </div>
    </div>
  );
}
