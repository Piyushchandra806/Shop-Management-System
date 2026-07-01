'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { usePoll } from '@/hooks/usePoll';

export default function OrdersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'list' or 'board' by default
  const searchParams = useSearchParams();
  const router = useRouter();

  // Toast logic for deleted orders
  const [deletedOrderToast, setDeletedOrderToast] = useState({ show: false, id: null, status: '' });
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const deletedId = searchParams.get('deletedOrder');
    if (deletedId) {
      setDeletedOrderToast({ show: true, id: deletedId, status: 'deleted' });
      // Remove query param without reloading page
      router.replace('/orders', { scroll: false });
    }
  }, [searchParams, router]);

  const handleUndoDelete = async (id) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/orders/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        setDeletedOrderToast({ show: true, id: id, status: 'restored' });
        // Refresh orders list
        refreshOrders();
        setTimeout(() => setDeletedOrderToast({ show: false, id: null, status: '' }), 5000);
      } else {
        alert('Failed to restore order');
      }
    } catch (err) {
      console.error(err);
      alert('Error restoring order');
    }
    setRestoring(false);
  };

  const handleRedoDelete = async (id) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedOrderToast({ show: true, id: id, status: 'deleted' });
        refreshOrders();
      } else {
        alert('Failed to delete order');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting order');
    }
    setRestoring(false);
  };

  // Customer options: either 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState('new'); // 'new' or 'existing'
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Order items state
  const [orderItems, setOrderItems] = useState([
    { productId: '', description: '', quantity: 1, unitPrice: 0 }
  ]);

  const [deliveryDate, setDeliveryDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState('0');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('cash');

  const [orderPhoto, setOrderPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err) {
      console.error("Failed to open camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const videoWidth = videoRef.current.videoWidth || 640;
      const videoHeight = videoRef.current.videoHeight || 480;
      
      const maxWidth = 800;
      let width = videoWidth;
      let height = videoHeight;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setOrderPhoto(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setOrderPhoto(null);
    startCamera();
  };

  const modalRef = useRef(null);

  // Poll orders list dynamically every 15 seconds
  const ordersUrl = `/api/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
  const { data: polledOrders, loading: ordersLoading, refresh: refreshOrders } = usePoll(ordersUrl, 15000);
  const orders = polledOrders || [];

  // Fetch catalogs once on mount
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [prodRes, userRes, custRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/settings/operators'),
          fetch('/api/customers')
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (userRes.ok) setOperators(await userRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
      } catch (err) {
        console.error('Error fetching catalogs:', err);
      }
    };
    fetchCatalogs();
  }, []);

  // Handle search with trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleOpenModal = () => {
    // Reset form states
    setCustomerMode('new');
    setSelectedCustomerId('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerAddress('');
    setOrderItems([{ productId: '', description: '', quantity: 1, unitPrice: 0 }]);
    setDeliveryDate('');
    setSpecialInstructions('');
    setAssignedToId('');
    setAdvancePaymentAmount('0');
    setAdvancePaymentMethod('cash');
    setOrderPhoto(null);
    setCameraActive(false);

    modalRef.current?.showModal();
  };

  const handleCloseModal = () => {
    stopCamera();
    modalRef.current?.close();
  };

  // Drag and drop state & handlers for Kanban Board
  const [draggingOrderId, setDraggingOrderId] = useState(null);

  const handleDragStart = (e, orderId) => {
    setDraggingOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const orderIdStr = e.dataTransfer.getData('text/plain') || draggingOrderId?.toString();
    if (!orderIdStr) return;
    const orderId = orderIdStr;
    setDraggingOrderId(null);

    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    // Operator permission checking
    const isAssigned = orderToUpdate.assignedToId === session?.user?.id || orderToUpdate.assignedToId === null;
    if (!isAdmin && !isAssigned) {
      alert('🔒 Access Denied: You can only update orders assigned to you.');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          note: `Status updated via board drag-and-drop to ${targetStatus}`
        })
      });

      if (res.ok) {
        refreshOrders();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Drag and drop update error:', err);
      alert('Error updating status via drag and drop');
    }
  };

  const handleAddItemRow = () => {
    setOrderItems([
      ...orderItems,
      { productId: '', description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length > 1) {
      const items = [...orderItems];
      items.splice(index, 1);
      setOrderItems(items);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;

    // If changing product selection, autofill default description and price
    if (field === 'productId' && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].description = `${prod.name}`;
        updated[index].unitPrice = prod.basePrice;
      }
    }

    setOrderItems(updated);
  };

  // Calculate order subtotal
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = {
        items: orderItems,
        deliveryDate,
        specialInstructions,
        assignedToId: assignedToId || null,
        advancePaymentAmount: parseFloat(advancePaymentAmount) || 0,
        advancePaymentMethod,
        orderPhoto: orderPhoto || null
      };

      if (customerMode === 'existing') {
        body.customerId = selectedCustomerId;
      } else {
        body.customerName = newCustomerName;
        body.customerPhone = newCustomerPhone;
        body.customerEmail = newCustomerEmail;
        body.customerAddress = newCustomerAddress;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        handleCloseModal();
        refreshOrders();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to create order');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if query params have create=true (triggered from Dashboard page "+ New Order" link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        // Open order modal
        handleOpenModal();
        // Remove query param
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const totalOrderSum = calculateTotal();

  // Kanban Board Columns setup
  const boardStages = [
    { key: 'new', label: 'New', color: 'var(--accent-primary)' },
    { key: 'designing', label: 'Designing', color: 'var(--accent-purple)' },
    { key: 'printing', label: 'Printing', color: 'var(--accent-warning)' },
    { key: 'ready', label: 'Ready', color: 'var(--accent-success)' },
    { key: 'delivered', label: 'Delivered', color: 'var(--text-muted)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Orders"
        subtitle="Manage, create, and track print jobs progress"
        action={session && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            + Add New Order
          </button>
        )}
      />

      {/* Control bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '8px'
      }}>
        {/* Search & filters */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '500px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search order#, customer name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost">🔍 Search</button>
        </form>

        {/* View and Status toggles */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Status filters */}
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px', padding: '8px 12px' }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="designing">Designing</option>
            <option value="printing">Printing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>

          {/* View mode toggle */}
          <div className="glass-card" style={{ padding: '2px', display: 'flex', gap: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ border: 'none' }}
            >
              📋 List
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('board')}
              style={{ border: 'none' }}
            >
              📊 Board
            </button>
          </div>
        </div>
      </div>

      {ordersLoading ? (
        <div className="skeleton glass-card" style={{ height: '400px', width: '100%' }} />
      ) : (
        <>
          {viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
              {orders.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>📁</span>
                  <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>No orders matching search criteria.</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order#</th>
                      <th>Customer</th>
                      <th>Items Summary</th>
                      <th>Delivery Date</th>
                      <th>Status</th>
                      {isAdmin && <th className="text-right">Total</th>}
                      {isAdmin && <th className="text-right">Due</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} style={{ cursor: 'pointer' }}>
                        <td>
                          <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.customer.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer.phone}</div>
                        </td>
                        <td className="truncate" style={{ maxWidth: '250px' }}>
                          {order.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}
                        </td>
                        <td>
                          {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        {isAdmin && (
                          <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            ₹{order.totalAmount}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="text-right" style={{
                            fontWeight: 600,
                            color: order.dueAmount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)'
                          }}>
                            ₹{order.dueAmount}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* KANBAN BOARD VIEW */
            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '16px',
              width: '100%',
              WebkitOverflowScrolling: 'touch'
            }}>
              {boardStages.map((stage) => {
                const stageOrders = orders.filter(o => o.status === stage.key);
                return (
                  <div 
                    key={stage.key} 
                    className="glass-card kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    style={{
                      padding: '16px 12px',
                      background: 'rgba(15, 23, 42, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minHeight: '450px',
                      border: draggingOrderId ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                      transition: 'border 0.2s ease, background-color 0.2s ease'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: `2px solid ${stage.color}`,
                      paddingBottom: '8px'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {stage.label}
                      </span>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {stageOrders.length}
                      </span>
                    </div>

                    {/* Stage Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '500px' }}>
                      {stageOrders.length === 0 ? (
                        <div style={{
                          border: '1px dashed var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '20px 0',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem'
                        }}>
                          Empty Lane
                        </div>
                      ) : (
                        stageOrders.map(order => (
                          <Link 
                            href={`/orders/${order.id}`} 
                            key={order.id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, order.id)}
                            style={{ display: 'block', textDecoration: 'none' }}
                          >
                            <div className="glass-card-hover" style={{
                              padding: '12px',
                              background: 'var(--bg-secondary)',
                              borderColor: 'var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              cursor: 'grab'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--accent-primary-hover)' }}>{order.orderNumber}</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {order.customer.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="truncate">
                                {order.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}
                              </div>
                              {isAdmin && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total:</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{order.totalAmount}</span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* NEW ORDER MODAL */}
      <dialog ref={modalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        outline: 'none',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>🖨️ Create New Print Order</h2>
          <button className="btn btn-ghost btn-sm" onClick={handleCloseModal} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 70px)' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Customer Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--accent-primary-hover)' }}>👤 Customer Information</h3>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${customerMode === 'new' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCustomerMode('new')}
                    style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    New Customer
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${customerMode === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCustomerMode('existing')}
                    style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Existing
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select
                    className="select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="enter name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="xxxxxxxxxx"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="name@gmail.com"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Billing Address (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Street, City, pincode"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

            {/* Order Items Section */}
            <div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0', color: 'var(--accent-primary-hover)' }}>🛍️ Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orderItems.map((item, index) => (
                  <div key={index} className="order-item-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 0.6fr 0.8fr 1fr auto',
                    gap: '12px',
                    alignItems: 'end',
                    background: 'rgba(15, 23, 42, 0.2)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}>
                    {/* Product Selection */}
                    <div className="form-group">
                      <label className="form-label">Product Type</label>
                      <select
                        className="select"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        required
                      >
                        <option value="">-- Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Description */}
                    <div className="form-group">
                      <label className="form-label">Custom Description</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Details (size, card name, ink type)"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </div>

                    {/* Qty */}
                    <div className="form-group">
                      <label className="form-label">Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="form-group">
                      <label className="form-label">Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                    </div>

                    {/* Row Total */}
                    <div className="form-group" style={{ paddingBottom: '10px' }}>
                      <span className="form-label">Row Total</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        ₹{((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '8px', color: 'var(--accent-danger)', border: 'none', background: 'transparent' }}
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={orderItems.length === 1}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                  onClick={handleAddItemRow}
                >
                  + Add Item Row
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

            {/* Production & Assigning Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div className="form-group">
                <label className="form-label">Delivery Deadline *</label>
                <input
                  type="date"
                  className="input"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Production Operator</label>
                <select
                  className="select"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Special Instructions</label>
                <textarea
                  className="textarea"
                  placeholder="Notes on formatting, cutting, layout proofs, paper details..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
              </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

            {/* Camera Photo Capture Section */}
            <div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0', color: 'var(--accent-primary-hover)' }}>📸 Capture Order Photo</h3>
              
              <div className="glass-card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(15, 23, 42, 0.2)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                {!cameraActive && !orderPhoto && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={startCamera}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    📷 Open Camera
                  </button>
                )}

                {cameraActive && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        maxWidth: '480px',
                        borderRadius: 'var(--radius-sm)',
                        transform: 'scaleX(-1)',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                        📸 Capture Photo
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={stopCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {orderPhoto && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <img
                      src={orderPhoto}
                      alt="Order Preview"
                      style={{
                        width: '100%',
                        maxWidth: '480px',
                        borderRadius: 'var(--radius-sm)',
                        border: '2px solid var(--accent-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" className="btn btn-secondary" onClick={retakePhoto}>
                        🔄 Retake Photo
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ color: 'var(--accent-danger)' }} onClick={() => setOrderPhoto(null)}>
                        🗑️ Remove Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

            {/* Billing Details */}
            <div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0', color: 'var(--accent-primary-hover)' }}>💰 Billing & Payment</h3>
              <div className="billing-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                gap: '20px',
                alignItems: 'center',
                background: 'rgba(99, 102, 241, 0.05)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Grand Total</span>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{totalOrderSum.toLocaleString('en-IN')}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Advance Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={totalOrderSum}
                    className="input"
                    value={advancePaymentAmount}
                    onChange={(e) => setAdvancePaymentAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="select"
                    value={advancePaymentMethod}
                    onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI (GPay/PhonePe)</option>
                    <option value="card">💳 Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            <button type="button" className="btn btn-ghost" onClick={handleCloseModal} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Order...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </dialog>
      {/* Deleted Order Toast */}
      {deletedOrderToast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {deletedOrderToast.status === 'deleted' ? 'Order deleted successfully.' : 'Order restored successfully.'}
          </span>
          {deletedOrderToast.status === 'deleted' ? (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleUndoDelete(deletedOrderToast.id)}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Undo'}
            </button>
          ) : (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleRedoDelete(deletedOrderToast.id)}
              disabled={restoring}
            >
              {restoring ? 'Deleting...' : 'Redo (Delete)'}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDeletedOrderToast({ show: false, id: null, status: '' })}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile responsiveness style overrides */}
      <style jsx global>{`
        @media (min-width: 1025px) {
          .kanban-column {
            min-width: 160px !important;
            flex: 1 1 160px !important;
          }
        }
        @media (max-width: 1024px) {
          .kanban-column {
            min-width: 250px !important;
            flex: 1 0 250px !important;
          }
        }
        @media (max-width: 768px) {
          .order-item-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .billing-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
