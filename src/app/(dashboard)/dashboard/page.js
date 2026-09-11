'use client';

import { useState, useRef } from 'react';
import { usePoll } from '@/hooks/usePoll';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell, Settings, Search, TrendingUp, TrendingDown, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('Overview');
  const [chartTimeRange, setChartTimeRange] = useState('1Y');
  const [pendingPaymentsOrders, setPendingPaymentsOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const pendingModalRef = useRef(null);
  
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'message', text: 'Operator Rahul sent a message: "The printing for order #ORD-1002 is delayed due to low cyan toner."', time: '10 mins ago', read: false },
    { id: 2, type: 'alert', text: 'Order #ORD-993 has been successfully delivered.', time: '1 hour ago', read: false }
  ]);
  const notificationModalRef = useRef(null);

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="skeleton skeleton-title" style={{ width: '200px' }} />
            <div className="skeleton skeleton-text" style={{ width: '150px' }} />
          </div>
          <div className="skeleton" style={{ width: '250px', height: '40px', borderRadius: '20px' }} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton skeleton-card glass-card" style={{ height: '200px' }} />
          ))}
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
  const userName = session?.user?.name || 'User';

  // Mock data for the area chart to match the UI visual
  const chartData = [
    { name: 'Jan', value: 120000 },
    { name: 'Feb', value: 140000 },
    { name: 'Mar', value: 110000 },
    { name: 'Apr', value: 150000 },
    { name: 'May', value: 125000 },
    { name: 'Jun', value: 180000 },
    { name: 'Jul', value: 165000 },
    { name: 'Aug', value: 190000 },
    { name: 'Sep', value: 175000 },
    { name: 'Oct', value: 140000 },
    { name: 'Nov', value: 110000 },
    { name: 'Dec', value: 95000 }
  ];

  const statusMap = {
    new: { label: 'New', color: 'var(--accent-primary)', change: '+12.5%' },
    designing: { label: 'Designing', color: 'var(--accent-info)', change: '+5.2%' },
    printing: { label: 'Printing', color: 'var(--accent-warning)', change: '-2.1%' },
    ready: { label: 'Ready', color: 'var(--accent-success)', change: '+8.4%' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Welcome, </span>
            <span style={{ color: 'var(--text-primary)' }}>{userName}</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Here's your print shop performance overview
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Icons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => notificationModalRef.current?.showModal()} 
              style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', position: 'relative' }}
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, background: 'var(--accent-danger)', borderRadius: '50%' }} />
              )}
            </button>
            <button 
              onClick={() => router.push('/settings')}
              style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <Settings size={18} />
            </button>
          </div>
          
          {/* Profile snippet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)', padding: '6px 16px 6px 6px', borderRadius: '40px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{userName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isOperator ? 'Operator' : 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Pills + Search) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '40px' }}>
          {[
            { label: 'Overview', path: '/dashboard' }, 
            { label: 'Orders', path: '/orders' }, 
            { label: 'Inventory', path: '/inventory' }
          ].map(tab => (
            <button 
              key={tab.label}
              onClick={() => router.push(tab.path)}
              style={{ 
                padding: '8px 24px', 
                borderRadius: '30px', 
                background: tab.label === 'Overview' ? 'rgba(255,255,255,0.08)' : 'transparent', 
                color: tab.label === 'Overview' ? 'var(--text-primary)' : 'var(--text-muted)', 
                border: 'none', 
                fontWeight: 500, 
                fontSize: '0.9rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Ask PrintPress AI anything..." 
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              padding: '12px 20px 12px 42px',
              borderRadius: '40px',
              color: 'var(--text-primary)',
              width: '320px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Main Grid Top Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1.5fr) minmax(300px, 1fr)',
        gap: '24px'
      }} className="animate-slide-up">
        
        {/* Left Col: Total Revenue & Promo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Total Revenue Card */}
          <div className="glass-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
            {/* Soft pink glow blob behind */}
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--accent-primary)', filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{isOperator ? 'Assigned Today' : "Today's Revenue"}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg-tertiary)', borderRadius: '20px', color: 'var(--text-muted)' }}>1D</span>
              </div>
            </div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {isOperator ? stats.todayOrders : (stats.monthlyRevenue !== undefined ? `₹${stats.monthlyRevenue.toLocaleString('en-IN')}` : '₹0')}
            </h2>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Orders</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '1.1rem' }}>{stats.pendingOrders}</p>
              </div>
              {!isOperator && (
                <div onClick={handleOpenPendingPayments} style={{ cursor: 'pointer' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Payments</p>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent-danger)' }}>
                    {stats.pendingPayments !== undefined ? `₹${stats.pendingPayments.toLocaleString('en-IN')}` : '₹0'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Decisions Promo Card */}
          <div className="glass-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(220,163,232,0.05) 100%)' }}>
            <div style={{ position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 100, background: 'var(--accent-primary)', filter: 'blur(50px)', opacity: 0.3, borderRadius: '50%' }} />
            
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', position: 'relative', zIndex: 1 }}>Empower Your Shop</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
              Move beyond guesswork with real-time print pipeline tracking tailored to your strategy.
            </p>
            <Link href="/orders?create=true" style={{ position: 'relative', zIndex: 1, textDecoration: 'none' }}>
              <div style={{ background: 'var(--gradient-primary)', padding: '10px 24px', borderRadius: '30px', color: '#fff', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(220,163,232,0.3)' }}>
                + New Order
              </div>
            </Link>
          </div>
        </div>

        {/* Middle Col: Pipeline Stages (Watchlist equivalent) */}
        <div className="glass-card stagger-1 animate-slide-up" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pipeline Stages</h3>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '20px' }}>
              <span style={{ fontSize: '0.75rem', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: 'var(--text-primary)' }}>Count</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {Object.keys(statusMap).map(status => {
              const count = ordersByStatus[status] || 0;
              const info = statusMap[status];
              const isPositive = info.change.startsWith('+');
              return (
                <div key={status} onClick={() => handleOpenStatsModal((info.label || status) + ' Stage', status)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }} className="glass-card-hover">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: `rgba(255,255,255,0.03)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Activity size={18} color={info.color} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{info.label}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Orders</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>{count}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {info.change}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Recent Assigned or Low Stock (My Portfolio equivalent) */}
        <div className="glass-card stagger-2 animate-slide-up" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Orders</h3>
            <Link href="/orders" style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: '16px', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              See all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {recentOrders.slice(0, 4).map(order => {
              const isPaid = order.dueAmount === 0;
              return (
                <div key={order.id} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.75rem', color: isPaid ? 'var(--accent-success)' : 'var(--accent-warning)', background: isPaid ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {isPaid ? 'PAID' : 'DUE'}
                    </span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>₹{order.totalAmount}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }} className="truncate">{order.customer.name}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusMap[order.status]?.color || 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{statusMap[order.status]?.label || order.status}</span>
                  </div>
                </div>
              );
            })}
            
            {recentOrders.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent orders found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area Chart */}
      <div className="glass-card stagger-3 animate-slide-up" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Monthly Performance</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Revenue trend over the current year</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Month</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{stats.monthlyRevenue || 140000}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '20px' }}>
              {['1D', '1W', '1M', '6M', '1Y'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setChartTimeRange(t)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '16px', 
                    background: chartTimeRange === t ? 'rgba(255,255,255,0.05)' : 'transparent', 
                    color: chartTimeRange === t ? 'var(--text-primary)' : 'var(--text-muted)', 
                    border: 'none', 
                    fontSize: '0.75rem', 
                    cursor: 'pointer' 
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


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
        {/* Modal content remains functionally the same, styled for dark mode via classes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.03)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Outstanding Dues</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => pendingModalRef.current?.close()} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingPending ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Loading outstanding orders...</div>
          ) : pendingPaymentsOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No pending payments! All orders are fully paid. 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingPaymentsOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <Link href={`/orders/${order.id}`} onClick={() => pendingModalRef.current?.close()} style={{ fontWeight: 700, color: 'var(--accent-primary-hover)', textDecoration: 'none', fontSize: '0.9rem' }}>{order.orderNumber}</Link>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{order.customer?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Amount</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-danger)', marginTop: '2px' }}>₹{order.dueAmount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => pendingModalRef.current?.close()}>Close</button>
        </div>
      </dialog>

      {/* STATS DETAIL DIALOG MODAL */}
      <dialog ref={statsModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto', border: '1px solid var(--border-color)', padding: '0', width: '90%', maxWidth: '750px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.03)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>📋 {statsDetailTitle}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => statsModalRef.current?.close()} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Loading orders...</div>
          ) : statsDetailOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No orders found in this category.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {statsDetailOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link href={`/orders/${order.id}`} onClick={() => statsModalRef.current?.close()} style={{ fontWeight: 700, color: 'var(--accent-primary-hover)', textDecoration: 'none', fontSize: '0.9rem' }}>{order.orderNumber}</Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{order.customer?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{order.totalAmount}</div>
                    {order.dueAmount > 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>Due: ₹{order.dueAmount}</div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>Paid</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => statsModalRef.current?.close()}>Close</button>
        </div>
      </dialog>

      {/* NOTIFICATIONS DIALOG MODAL */}
      <dialog ref={notificationModalRef} className="glass-modal animate-scale-in" style={{
        margin: 'auto', border: '1px solid var(--border-color)', padding: '0', width: '90%', maxWidth: '500px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.03)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🔔 Notifications</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => notificationModalRef.current?.close()} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>You have no new notifications.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {notif.type === 'message' && <span style={{ marginRight: '6px' }}>💬</span>}
                    {notif.type === 'alert' && <span style={{ marginRight: '6px' }}>✅</span>}
                    {notif.text}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {notif.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setNotifications(notifications.map(n => ({...n, read: true})));
          }} style={{ color: 'var(--text-muted)' }}>Mark all as read</button>
          <button className="btn btn-ghost btn-sm" onClick={() => notificationModalRef.current?.close()}>Close</button>
        </div>
      </dialog>
    </div>
  );
}
