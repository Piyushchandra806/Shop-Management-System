'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', setupSecret: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-hide success/error on change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.setupSecret) {
      setError('All fields are required, including the setup secret.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          setupSecret: form.setupSecret,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Setup failed.');
      } else {
        setSuccess('Admin account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Primary blob */}
      <div style={{
        position: 'absolute', top: '-140px', right: '-80px',
        width: '420px', height: '420px',
        background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      {/* Decorative Secondary blob */}
      <div style={{
        position: 'absolute', bottom: '-120px', left: '-100px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div className="glass-card animate-scale-in auth-card" style={{
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px', height: '60px',
            background: 'var(--gradient-primary)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
            margin: '0 auto 16px auto',
            boxShadow: 'var(--shadow-glow-primary)'
          }}>
            🖨️
          </div>
          <h1 style={{ marginTop: '12px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            First-Time Admin Setup
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            Create the primary administrator account
          </p>
          <p style={{
            color: 'var(--accent-warning)',
            fontSize: '0.75rem',
            marginTop: '10px',
            background: 'rgba(251, 191, 36, 0.1)',
            padding: '6px 14px',
            borderRadius: '8px',
            display: 'inline-block',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}>
            ⚠️ This page will be disabled after the first admin is created.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.30)',
            color: '#FCA5A5',
            fontSize: '0.85rem',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            color: 'var(--accent-success)',
            fontSize: '0.85rem',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Setup Secret *</label>
            <input
              type="password"
              name="setupSecret"
              placeholder="Server Setup Secret"
              value={form.setupSecret}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>

          <div className="responsive-grid-2" style={{ gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="Min 6 chars"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm *</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              background: loading ? 'rgba(220,163,232,0.40)' : 'var(--gradient-primary)',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: loading ? 'none' : 'var(--shadow-glow-primary)',
              letterSpacing: '0.01em'
            }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Initialize System'}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Already initialized?{' '}
            <Link href="/login" style={{
              color: 'var(--accent-primary)',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '1px solid var(--border-color-focus)',
              paddingBottom: '1px'
            }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
