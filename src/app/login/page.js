'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

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

      if (result?.error) {
        setError(result.error);
      } else {
        // Use window.location to force a hard navigation.
        // We explicitly use our resolved callbackUrl instead of result?.url
        // because NextAuth defaults result.url back to the current page (/login) if empty.
        window.location.href = callbackUrl;
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

      {/* Login Card */}
      <div className="animate-scale-in glass-card auth-card" style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0'
          }}>
            PrintPress
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
                background: 'var(--bg-tertiary)',
                border: emailError
                  ? '1px solid var(--accent-danger)'
                  : '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, -apple-system, sans-serif',
                boxShadow: emailError ? '0 0 0 3px var(--accent-danger-glow)' : 'none'
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
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
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
                ? 'rgba(220,163,232,0.40)'
                : 'var(--gradient-primary)',
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
          >
            {loading ? '⏳ Signing In...' : '🔓 Sign In'}
          </button>
        </form>

        {/* Footer Removed */}
      </div>
    </div>
  );
}
