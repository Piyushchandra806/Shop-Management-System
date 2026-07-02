'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
  }, []);

  const validateEmail = (emailValue) => {
    if (!emailValue || emailValue.trim() === '') return 'Please enter your email address';
    if (!emailValue.includes('@')) return 'Please enter a valid email address (must contain @)';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) return 'Please enter a valid email address (e.g. user@example.com)';
    return '';
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleEmailBlur = () => {
    if (email.trim()) setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      alert(emailValidationError);
      return;
    }
    if (!password || password.trim() === '') {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error);
      } else {
        sessionStorage.setItem('wasLoggedIn', 'true');
        router.push('/dashboard');
        router.refresh();
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
      /* Slate 900 base */
      background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Decorative Emerald blob */}
      <div style={{
        position: 'absolute', top: '-140px', right: '-80px',
        width: '420px', height: '420px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      {/* Decorative Slate blob */}
      <div style={{
        position: 'absolute', bottom: '-120px', left: '-100px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(100,116,139,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      {/* Login Card — Slate 800 glass */}
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        background: 'rgba(30, 41, 59, 0.70)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.40), inset 0 0 0 1px rgba(148,163,184,0.08)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '20px',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '60px', height: '60px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
          }}>
            🖨️
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#F8FAFC',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0'
          }}>
            MayankComputer
          </h1>
          <p style={{
            color: '#64748B',
            fontSize: '0.88rem',
            margin: 0,
            fontWeight: 400
          }}>
            Printing Shop Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.30)',
            color: '#FCA5A5',
            fontSize: '0.85rem',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Email Address
            </label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              disabled={loading}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.60)',
                border: emailError
                  ? '1px solid rgba(239,68,68,0.55)'
                  : '1px solid rgba(148,163,184,0.18)',
                borderRadius: '10px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, -apple-system, sans-serif',
                boxShadow: emailError ? '0 0 0 3px rgba(239,68,68,0.14)' : 'none'
              }}
            />
            {emailError && (
              <p style={{ color: '#FCA5A5', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⚠️</span> {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Password
              </label>
              <Link href="/forgot-password" style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textDecoration: 'none'
              }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.60)',
                border: '1px solid rgba(148,163,184,0.18)',
                borderRadius: '10px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, -apple-system, sans-serif'
              }}
            />
          </div>

          {/* Sign In */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              background: loading
                ? 'rgba(16,185,129,0.40)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.35)',
              letterSpacing: '0.01em'
            }}
          >
            {loading ? '⏳ Signing In...' : '🔓 Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            Don&apos;t have an administrator account?{' '}
            <Link href="/register" style={{
              color: '#10B981',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(16,185,129,0.35)',
              paddingBottom: '1px'
            }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
