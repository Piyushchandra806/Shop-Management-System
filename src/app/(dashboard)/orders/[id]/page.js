'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState([]);
  
  // Note adding state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Payment recording state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('upi');
  const [payType, setPayType] = useState('partial');
  const [payNote, setPayNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Status updating state
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const paymentModalRef = useRef(null);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);

      // Fetch operators for assignment select
      const opRes = await fetch('/api/settings/operators');
      if (opRes.ok) setOperators(await opRes.json());
    } catch (err) {
      console.error(err);
      alert('Failed to load order details');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  if (loading) {
    return <div className="skeleton glass-card" style={{ height: '500px', width: '100%' }} />;
  }

  if (!order) return null;

  const isAdmin = session?.user?.role === 'admin';

  // Status transition pipeline mapping
  // Status transition pipeline mapping
  const statusPipeline = ['new', 'designing', 'printing', 'ready', 'delivered'];
  const currentStatusIndex = statusPipeline.indexOf(order.status);
  const nextStatus = currentStatusIndex < statusPipeline.length - 1 ? statusPipeline[currentStatusIndex + 1] : null;
  const prevStatus = currentStatusIndex > 0 ? statusPipeline[currentStatusIndex - 1] : null;

  const isAssignedOperator = !isAdmin && order.assignedToId === session?.user?.id;
  const canUpdateStatus = isAdmin || isAssignedOperator;

  // WhatsApp wa.me links helpers
  const getWhatsAppLink = (type) => {
    const phone = order.customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`; // Auto add India country code if not present
    
    // Construct local tracking link
    const trackUrl = `${window.location.origin}/track/${order.orderNumber}`;

    let message = '';
    if (type === 'confirm') {
      message = `Hi ${order.customer.name}, your print order ${order.orderNumber} has been received! 🖨️\n\nTotal Amount: ₹${order.totalAmount}\nPaid Advance: ₹${order.paidAmount}\nDue Amount: ₹${order.dueAmount}\n\nTrack order live progress here: ${trackUrl}`;
    } else if (type === 'ready') {
      message = `Hi ${order.customer.name}, your print order ${order.orderNumber} is READY for pickup! ✅\n\nPlease visit the shop to collect your items.\nRemaining Due Amount: ₹${order.dueAmount}\n\nLive tracking: ${trackUrl}`;
    }

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendWhatsApp = async (type) => {
    try {
      await fetch(`/api/orders/${order.id}/whatsapp-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      fetchOrderDetail();
    } catch (err) {
      console.error('Failed to log WhatsApp link: ', err);
    }
    const waLink = getWhatsAppLink(type);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  // Record a payment transaction
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: payMethod,
          type: payType,
          note: payNote
        })
      });

      if (res.ok) {
        paymentModalRef.current?.close();
        setPayAmount('');
        setPayNote('');
        fetchOrderDetail();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Update order status stage
  const handleUpdateStatus = async (targetStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          note: statusUpdateNote || `Status updated to ${targetStatus}`
        })
      });

      if (res.ok) {
        setStatusUpdateNote('');
        fetchOrderDetail();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Update operator assignment
  const handleOperatorChange = async (operatorId) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: operatorId || null
        })
      });

      if (res.ok) {
        fetchOrderDetail();
      } else {
        alert('Failed to update operator assignment');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating operator assignment');
    }
  };

  // Add production note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });

      if (res.ok) {
        setNewNote('');
        fetchOrderDetail();
      } else {
        alert('Failed to add note');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Delete order (Admin only)
  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/orders');
      } else {
        alert('Failed to delete order');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting order');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/orders" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ← Back to Orders
        </Link>
      </div>

      <PageHeader
        title={`Order: ${order.orderNumber}`}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`}
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteOrder}>
                🗑️ Delete Order
              </button>
            )}
            <button
              className="btn btn-success btn-sm"
              onClick={() => {
                window.open(`/orders/${order.id}/print`, '_blank');
              }}
            >
              🖨️ Print Slip
            </button>
          </div>
        }
      />

      {/* Main 3-Column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr 1.2fr',
        gap: '24px',
      }} className="order-details-grid">
        
        {/* LEFT COLUMN: Order & Customer Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* QR Code Card */}
          <div className="glass-card text-center" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '16px' }}>Scan QR Tracking</h3>
            {order.qrCodeData ? (
              <img
                src={order.qrCodeData}
                alt="Order QR Code"
                style={{ width: '160px', height: '160px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }}
              />
            ) : (
              <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>No QR Generated</div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', wordBreak: 'break-all' }}>
              Customer scans QR to see order status page live.
            </p>
          </div>

          {/* Captured Order Photo Card */}
          {order.orderPhoto && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                📸 Captured Order Photo
              </h3>
              <a href={order.orderPhoto} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.orderPhoto}
                  alt="Captured Order"
                  style={{
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </a>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Click image to view full size.
              </p>
            </div>
          )}

          {/* Customer Profile Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              👤 Customer Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Customer Name</label>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.customer.name}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Phone</label>
                <div style={{ fontWeight: 600 }}>{order.customer.phone}</div>
              </div>
              {order.customer.email && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Email</label>
                  <div style={{ fontSize: '0.85rem' }}>{order.customer.email}</div>
                </div>
              )}
              {order.customer.address && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Billing Address</label>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.customer.address}</div>
                </div>
              )}
            </div>

            {/* WhatsApp Integration Buttons */}
            {isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => handleSendWhatsApp('confirm')}
                  className="btn btn-ghost btn-sm text-center"
                  style={{ width: '100%', borderColor: '#25D366', color: '#25D366', background: 'transparent', cursor: 'pointer' }}
                >
                  💬 Send Confirmation WA
                </button>
                <button
                  onClick={() => handleSendWhatsApp('ready')}
                  className="btn btn-ghost btn-sm text-center"
                  style={{ width: '100%', borderColor: '#25D366', color: '#25D366', background: 'transparent', cursor: 'pointer' }}
                >
                  💬 Send Ready Alert WA
                </button>
              </div>
            )}
          </div>

          {/* Operator Assignment Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>⚙️ Operator Assignment</h3>
            <div className="form-group">
              <label className="form-label">Assigned Operator</label>
              <select
                className="select"
                value={order.assignedToId || ''}
                onChange={(e) => handleOperatorChange(e.target.value)}
                disabled={!isAdmin}
              >
                <option value="">-- Unassigned --</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            </div>
            {!isAdmin && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Only the admin owner can change operator assignments.
              </p>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Items Invoice, Deadlines, Payments History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Order Summary & Items list */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📦 Order Items</h3>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '8px' }}>Deadline:</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: new Date(order.deliveryDate) < new Date() ? 'var(--accent-danger)' : 'var(--text-primary)'
                }}>
                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <table className="table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Item Detail</th>
                  <th className="text-right">Qty</th>
                  {isAdmin && <th className="text-right">Rate</th>}
                  {isAdmin && <th className="text-right">Total</th>}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product?.name || 'Custom Product'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</div>
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    {isAdmin && <td className="text-right">₹{item.unitPrice}</td>}
                    {isAdmin && (
                      <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        ₹{item.totalPrice}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {order.specialInstructions && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  💡 Special Instructions
                </div>
                <p style={{ margin: 0, color: 'var(--text-primary)' }}>{order.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* Billing & Invoice Summary Card */}
          {isAdmin && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💰 Billing Summary</h3>
                {order.dueAmount > 0 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => paymentModalRef.current?.showModal()}
                  >
                    💳 Record Payment
                  </button>
                ) : (
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-success)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}>
                    ✅ FULLY PAID
                  </span>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Grand Total</p>
                  <h4 style={{ margin: '6px 0 0 0', fontSize: '1.3rem', fontWeight: 800 }}>₹{order.totalAmount}</h4>
                </div>
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-success)', textTransform: 'uppercase', fontWeight: 600 }}>Paid Amount</p>
                  <h4 style={{ margin: '6px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)' }}>₹{order.paidAmount}</h4>
                </div>
                <div style={{
                  padding: '16px',
                  background: order.dueAmount > 0 ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: order.dueAmount > 0 ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid var(--border-color)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: order.dueAmount > 0 ? 'var(--accent-danger)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Due Balance</p>
                  <h4 style={{
                    margin: '6px 0 0 0',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: order.dueAmount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)'
                  }}>
                    ₹{order.dueAmount}
                  </h4>
                </div>
              </div>

              {/* Payment history transactions list */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Payment History
                </h4>
                {order.payments.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No payments recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.payments.map((p) => (
                      <div key={p.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(15, 23, 42, 0.2)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.85rem'
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{p.amount}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.75rem' }}>
                            ({p.type} via {p.method.toUpperCase()})
                          </span>
                          {p.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Note: {p.note}</div>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Order status pipeline tracking and logs notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Status Pipeline Update Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>⚙️ Order Status</h3>
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Current Stage</label>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Status next stage button */}
            {nextStatus ? (
              canUpdateStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="status-note">Transition Note (Optional)</label>
                    <input
                      type="text"
                      id="status-note"
                      className="input"
                      placeholder="e.g. sent design draft to customer"
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      disabled={updatingStatus}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleUpdateStatus(nextStatus)}
                    disabled={updatingStatus}
                  >
                    🚀 Move to {nextStatus.toUpperCase()}
                  </button>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)'
                }}>
                  🔒 Assigned to {order.assignedTo?.name || 'another operator'}
                </div>
              )
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.05)',
                color: 'var(--accent-success)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                🎉 Order is fully completed!
              </div>
            )}

            {/* Previous Status Reversal Option */}
            {prevStatus && canUpdateStatus && (
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => handleUpdateStatus(prevStatus)}
                disabled={updatingStatus}
              >
                ⬅️ Back to {prevStatus.toUpperCase()}
              </button>
            )}

            {/* Quick dropdown override (Admin only) */}
            {isAdmin && (
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label">Admin Status Override</label>
                <select
                  className="select"
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={updatingStatus}
                  style={{ marginTop: '4px' }}
                >
                  {statusPipeline.map(st => (
                    <option key={st} value={st}>{st.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes & Comments Card */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>💬 Production Notes</h3>
            
            {/* Add note form */}
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Add layout/paper notes..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={submittingNote}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }} disabled={submittingNote}>
                +
              </button>
            </form>

            {/* Notes list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {order.notes.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No production notes.</p>
              ) : (
                order.notes.map((note) => (
                  <div key={note.id} style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{note.createdBy.name}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History Status Change Timeline Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📜 Status Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              {order.statusLogs.map((log) => (
                <div key={log.id} style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '0.8rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--accent-primary)',
                      marginTop: '6px'
                    }} />
                    <span style={{
                      flex: 1,
                      width: '2px',
                      background: 'var(--border-color)',
                      marginTop: '4px'
                    }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {log.fromStatus === 'none' ? 'Order Placed' : `${log.fromStatus} → ${log.toStatus}`}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      By {log.updatedBy.name} • {new Date(log.changedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                    {log.note && <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{log.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RECORD PAYMENT DIALOG MODAL */}
      <dialog ref={paymentModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '400px',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-success)',
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>💳 Record Payment</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => paymentModalRef.current?.close()} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        <form onSubmit={handleRecordPayment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={order.dueAmount}
              className="input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`Remaining: ₹${order.dueAmount}`}
              required
              disabled={submittingPayment}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="select"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              disabled={submittingPayment}
            >
              <option value="upi">UPI (GPay/PhonePe)</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Type *</label>
            <select
              className="select"
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
              disabled={submittingPayment}
            >
              <option value="partial">Partial Payment</option>
              <option value="final">Final Payment</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Note (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Paid online"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              disabled={submittingPayment}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => paymentModalRef.current?.close()} disabled={submittingPayment}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submittingPayment}>
              {submittingPayment ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </dialog>

      {/* Responsive layout CSS overrides */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .order-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
