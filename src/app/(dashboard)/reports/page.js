import PageHeader from '@/components/PageHeader';

export default function ReportsPage() {
  const mockCards = [
    { title: 'Gross Revenue (YTD)', value: '₹4,52,000', label: 'FY 2026-27', icon: '📈' },
    { title: 'Average Job Value', value: '₹1,250', label: 'Based on 360 orders', icon: '📊' },
    { title: 'Top Catalog Service', value: 'Wedding Cards', label: '42% of total order sales', icon: '🏷️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business insights, monthly revenue growth and popular products"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        opacity: 0.6
      }}>
        {mockCards.map((card, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{card.title}</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0 0', color: 'var(--text-secondary)' }}>{card.value}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.label}</span>
            </div>
            <span style={{ fontSize: '2rem' }}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="glass-card animate-slide-up" style={{
        padding: '80px 40px',
        textAlign: 'center',
        background: 'rgba(99, 102, 241, 0.02)',
        borderColor: 'rgba(99, 102, 241, 0.08)',
        boxShadow: 'var(--shadow-glow-primary)',
        marginTop: '16px'
      }}>
        <span style={{ fontSize: '4rem' }}>📊</span>
        <h2 style={{ marginTop: '16px', fontSize: '1.5rem', fontWeight: 800 }}>Business Reports Coming Soon</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '8px auto 0 auto', fontSize: '0.9rem' }}>
          We are currently aggregating your print shop orders sales, material consumption logs, and payment due indexes. Graphs and CSV export downloads will be activated here in Phase 4.
        </p>
      </div>
    </div>
  );
}
