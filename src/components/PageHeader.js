export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="page-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}
