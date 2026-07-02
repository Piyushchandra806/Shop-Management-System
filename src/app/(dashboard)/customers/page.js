'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

export default function CustomersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit Customer Form State
  const editModalRef = useRef(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleOpenEditModal = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditAddress(customer.address || '');
    setEditNotes(customer.notes || '');
    editModalRef.current?.showModal();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      alert('Name and Phone Number are required');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          address: editAddress.trim() || null,
          notes: editNotes.trim() || null
        })
      });

      if (res.ok) {
        editModalRef.current?.close();
        fetchCustomers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update customer details');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating customer details');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCustomer = async (e, customerId, customerName) => {
    e.stopPropagation();
    alert(`Debug 1: clicked delete for ${customerName} (ID: ${customerId})`);
    if (!confirm(`⚠️ WARNING: Are you sure you want to permanently delete customer "${customerName}"?\n\nThis will ALSO permanently delete all orders, invoices, status logs, and payments associated with this customer. This action CANNOT be undone.`)) {
      alert("Debug 2: confirm dialog cancelled");
      return;
    }

    alert("Debug 3: confirm dialog accepted, calling fetch DELETE...");
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      alert(`Debug 4: fetch completed with status ${res.status}`);

      if (res.ok) {
        alert("Debug 5: delete response was OK, reloading customers list...");
        if (expandedCustomerId === customerId) {
          setExpandedCustomerId(null);
        }
        fetchCustomers();
      } else {
        const errData = await res.json();
        alert(`Debug 6: delete failed with error: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Debug Catch: deletion failed with exception: ${err.message || err}`);
    }
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
                        {/* Profile details + action button row */}
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
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => handleOpenEditModal(e, customer)}
                              style={{ borderRadius: '8px', padding: '6px 12px' }}
                            >
                              ✏️ Edit Details
                            </button>
                            {isAdmin && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={(e) => handleDeleteCustomer(e, customer.id, customer.name)}
                                style={{ borderRadius: '8px', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', padding: '6px 12px' }}
                              >
                                🗑️ Delete Customer
                              </button>
                            )}
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

      {/* EDIT CUSTOMER DIALOG MODAL */}
      <dialog ref={editModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '500px',
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>✏️ Edit Customer Profile</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => editModalRef.current?.close()} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        {editingCustomer && (
          <form onSubmit={handleSaveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={updating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="input"
                placeholder="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
                disabled={updating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Billing Address</label>
              <input
                type="text"
                className="input"
                placeholder="Address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Extra Notes / Details</label>
              <textarea
                className="textarea"
                placeholder="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                disabled={updating}
                style={{ minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => editModalRef.current?.close()} disabled={updating}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
