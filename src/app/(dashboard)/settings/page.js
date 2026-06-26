'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  // New product states
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Cards');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('per piece');
  const [addingProduct, setAddingProduct] = useState(false);

  // New operator states
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [addingOperator, setAddingOperator] = useState(false);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [prodRes, opRes] = await Promise.all([
        fetch('/api/products?all=true'), // Get all products (including inactive)
        fetch('/api/settings/operators')
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (opRes.ok) setOperators(await opRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const price = parseFloat(prodPrice);
    if (!prodName || isNaN(price) || price < 0) return;

    setAddingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          category: prodCategory,
          basePrice: price,
          unit: prodUnit
        })
      });

      if (res.ok) {
        setProdName('');
        setProdPrice('');
        fetchSettingsData();
      } else {
        alert('Failed to add product catalog item');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeactivateProduct = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        fetchSettingsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    if (!opName || !opEmail || !opPhone || !opPassword) return;

    setAddingOperator(true);
    try {
      const res = await fetch('/api/settings/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: opName,
          email: opEmail,
          phone: opPhone,
          password: opPassword
        })
      });

      if (res.ok) {
        setOpName('');
        setOpEmail('');
        setOpPhone('');
        setOpPassword('');
        fetchSettingsData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to add operator');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingOperator(false);
    }
  };

  const handleToggleOperatorStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/settings/operators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        fetchSettingsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Settings & Catalog"
        subtitle="Manage product price indexes and create operator staff logins"
      />

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px' }}>
        <button
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('products')}
          style={{ border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '10px 24px' }}
        >
          🏷️ Services & Products
        </button>
        <button
          className={`btn ${activeTab === 'operators' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('operators')}
          style={{ border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '10px 24px' }}
        >
          🔧 Operators Setup
        </button>
      </div>

      {loading ? (
        <div className="skeleton glass-card" style={{ height: '300px', width: '100%' }} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          gap: '24px'
        }} className="settings-grid">
          
          {/* TAB 1: SERVICES & PRODUCTS */}
          {activeTab === 'products' && (
            <>
              {/* Add Product Form */}
              <div className="glass-card" style={{ padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Add Catalog Item</h3>
                <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Service Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Wedding Card Special"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      required
                      disabled={addingProduct}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="select"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      disabled={addingProduct}
                    >
                      <option value="Cards">Wedding/Birth Cards</option>
                      <option value="Stationery">Office Stationery</option>
                      <option value="Marketing">Marketing (Pamphlets/Flyers)</option>
                      <option value="Large Format">Banners & Posters</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Base Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        required
                        disabled={addingProduct}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price Unit *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. per piece, per sq ft"
                        value={prodUnit}
                        onChange={(e) => setProdUnit(e.target.value)}
                        required
                        disabled={addingProduct}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={addingProduct}>
                    {addingProduct ? 'Adding...' : 'Add Service'}
                  </button>
                </form>
              </div>

              {/* Products List */}
              <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Catalog Directory</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th className="text-right">Price Index</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.5 }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td className="text-right" style={{ fontWeight: 600 }}>₹{p.basePrice} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/{p.unit}</span></td>
                        <td className="text-right">
                          <button
                            className={`btn btn-sm ${p.isActive ? 'btn-ghost' : 'btn-success'}`}
                            onClick={() => handleDeactivateProduct(p.id, p.isActive)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            {p.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 2: OPERATORS SETUP */}
          {activeTab === 'operators' && (
            <>
              {/* Add Operator Form */}
              <div className="glass-card" style={{ padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Create Staff Login</h3>
                <form onSubmit={handleCreateOperator} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Operator Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Raju Kumar"
                      value={opName}
                      onChange={(e) => setOpName(e.target.value)}
                      required
                      disabled={addingOperator}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Email *</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="e.g. raju@printpress.com"
                      value={opEmail}
                      onChange={(e) => setOpEmail(e.target.value)}
                      required
                      disabled={addingOperator}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Phone *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="e.g. 9876543211"
                      value={opPhone}
                      onChange={(e) => setOpPhone(e.target.value)}
                      required
                      disabled={addingOperator}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Login Password *</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={opPassword}
                      onChange={(e) => setOpPassword(e.target.value)}
                      required
                      disabled={addingOperator}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={addingOperator}>
                    {addingOperator ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </div>

              {/* Operators list */}
              <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Staff Accounts</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Email/Phone</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((op) => (
                      <tr key={op.id}>
                        {/* Staff Name + Role Badge */}
                        <td>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            marginBottom: '4px'
                          }}>
                            {op.name}
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: 'rgba(16, 185, 129, 0.10)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                          }}>
                            OPERATOR
                          </span>
                        </td>

                        {/* Email + Phone */}
                        <td>
                          <div style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem'
                          }}>
                            {op.email}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            marginTop: '2px'
                          }}>
                            📞 {op.phone}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td>
                          {op.isActive ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              background: 'rgba(34, 197, 94, 0.14)',
                              color: '#15803d',
                              border: '1px solid rgba(34, 197, 94, 0.35)'
                            }}>
                              ● Active
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.30)'
                            }}>
                              ● Suspended
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="text-right">
                          <button
                            onClick={() => handleToggleOperatorStatus(op.id, op.isActive)}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.18s ease',
                              background: op.isActive
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(34, 197, 94, 0.14)',
                              color: op.isActive ? '#dc2626' : '#15803d',
                              outline: op.isActive
                                ? '1px solid rgba(239, 68, 68, 0.30)'
                                : '1px solid rgba(34, 197, 94, 0.35)'
                            }}
                          >
                            {op.isActive ? '🔒 Suspend' : '✅ Unsuspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      )}

      {/* Responsive layout styling override */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
