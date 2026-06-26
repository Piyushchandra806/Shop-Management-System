'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';

export default function InventoryPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Item states
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Paper');
  const [newItemQty, setNewItemQty] = useState('0');
  const [newItemUnit, setNewItemUnit] = useState('reams');
  const [newItemThreshold, setNewItemThreshold] = useState('10');

  // Adjust Stock states
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustAction, setAdjustAction] = useState('added'); // 'added' or 'used'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const itemModalRef = useRef(null);
  const adjustModalRef = useRef(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenItemModal = () => {
    setNewItemName('');
    setNewItemCategory('Paper');
    setNewItemQty('0');
    setNewItemUnit('reams');
    setNewItemThreshold('10');
    itemModalRef.current?.showModal();
  };

  const handleOpenAdjustModal = (item, action) => {
    setSelectedItem(item);
    setAdjustAction(action);
    setAdjustQty('');
    setAdjustNote('');
    adjustModalRef.current?.showModal();
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          quantity: parseFloat(newItemQty) || 0,
          unit: newItemUnit,
          minThreshold: parseFloat(newItemThreshold) || 0
        })
      });

      if (res.ok) {
        itemModalRef.current?.close();
        fetchInventory();
      } else {
        alert('Failed to add inventory item');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: adjustAction,
          quantityChange: qty,
          note: adjustNote
        })
      });

      if (res.ok) {
        adjustModalRef.current?.close();
        fetchInventory();
      } else {
        alert('Failed to update stock');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Inventory Stock"
        subtitle="Monitor shop raw materials and record usage details"
        action={isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenItemModal}>
            + Add Inventory Item
          </button>
        )}
      />

      {loading ? (
        <div className="skeleton glass-card" style={{ height: '350px', width: '100%' }} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }} className="animate-slide-up">
          {inventory.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px', gridColumn: '1 / -1', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem' }}>📦</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>No items in inventory registry yet.</p>
            </div>
          ) : (
            inventory.map((item) => {
              // Calculate stock status color representation
              const isLow = item.quantity <= item.minThreshold;
              const isCritical = item.quantity === 0;

              let statusColor = 'var(--accent-success)';
              let statusLabel = 'Healthy';
              if (isLow) {
                statusColor = 'var(--accent-warning)';
                statusLabel = 'Low Stock';
              }
              if (isCritical) {
                statusColor = 'var(--accent-danger)';
                statusLabel = 'Out of Stock';
              }

              // Calculate stock level percentage for slider
              const percent = Math.min(100, (item.quantity / (item.minThreshold * 3)) * 100);

              return (
                <div key={item.id} className="glass-card" style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative'
                }}>
                  {/* Tag Indicator */}
                  <span style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: statusColor,
                    background: `rgba(${statusColor === 'var(--accent-success)' ? '16, 185, 129' : statusColor === 'var(--accent-warning)' ? '245, 158, 11' : '244, 63, 94'}, 0.1)`,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${statusColor}44`
                  }}>
                    {statusLabel}
                  </span>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {item.category}
                    </span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Quantity Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: statusColor }}>{item.quantity}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.unit}</span>
                  </div>

                  {/* Stock Level Slider */}
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Level Status</span>
                      <span>Min: {item.minThreshold} {item.unit}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, backgroundColor: statusColor, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Adjustment actions */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr',
                    gap: '12px',
                    marginTop: '8px'
                  }}>
                    {isAdmin && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenAdjustModal(item, 'added')}
                      >
                        ➕ Add Stock
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleOpenAdjustModal(item, 'used')}
                      style={{ color: isCritical ? 'var(--text-muted)' : 'var(--accent-danger)' }}
                      disabled={isCritical}
                    >
                      ➖ Consume Stock
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE NEW ITEM MODAL */}
      <dialog ref={itemModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '450px',
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>📦 Add Inventory Item</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => itemModalRef.current?.close()} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        <form onSubmit={handleCreateItem} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Material Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Gold Foil Sheets (A4)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="select"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              disabled={submitting}
            >
              <option value="Paper">📄 Paper / Stock Card</option>
              <option value="Ink">🧪 Ink / Toner cartridge</option>
              <option value="Finishing">✂️ Finishing / Lamination</option>
              <option value="Other">📦 Other Supplies</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Starting Quantity *</label>
              <input
                type="number"
                min="0"
                className="input"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Unit *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. reams, sheets, rolls"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Threshold *</label>
            <input
              type="number"
              min="0"
              className="input"
              value={newItemThreshold}
              onChange={(e) => setNewItemThreshold(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => itemModalRef.current?.close()} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </dialog>

      {/* ADJUST STOCK MODAL */}
      <dialog ref={adjustModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto',
        border: '1px solid var(--border-color)',
        padding: '0',
        width: '90%',
        maxWidth: '400px',
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            {adjustAction === 'added' ? '➕ Add Stock' : '➖ Consume Stock'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => adjustModalRef.current?.close()} style={{ padding: '6px 10px' }}>✕</button>
        </div>

        {selectedItem && (
          <form onSubmit={handleAdjustStock} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Item: <strong>{selectedItem.name}</strong></span>
              <span>Current: <strong>{selectedItem.quantity} {selectedItem.unit}</strong></span>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity to {adjustAction === 'added' ? 'Add' : 'Consume'} *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={adjustAction === 'used' ? selectedItem.quantity : undefined}
                className="input"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder={`e.g. 5 (${selectedItem.unit})`}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Note (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Restocked paper, Used for wedding cards order"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => adjustModalRef.current?.close()} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
