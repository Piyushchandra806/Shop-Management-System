'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify & Reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // For development demo purposes: hold the simulated SMS OTP
  const [smsMock, setSmsMock] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to request OTP');
      } else {
        setSuccess('OTP has been successfully sent to your registered mobile number.');
        // Set mock SMS display
        setSmsMock({
          phone: data.phone,
          otp: data.debugOtp
        });
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess('Your password has been successfully reset! Redirecting to login...');
        setSmsMock(null); // Clear simulated SMS
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
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
      background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>

      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-140px', right: '-80px',
        width: '420px', height: '420px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-120px', left: '-100px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(100,116,139,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      {/* Floating Mock SMS Toast */}
      {smsMock && (
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: '#0F172A',
          border: '1px solid #10B981',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#F8FAFC',
          maxWidth: '300px',
          zIndex: 99,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 10px rgba(16,185,129,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>
            <span>💬 MOCK SMS NETWORK</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            To phone: <strong>{smsMock.phone}</strong><br />
            Your MayankComputer password reset OTP is: <strong style={{ color: '#10B981', fontSize: '1rem', letterSpacing: '1px' }}>{smsMock.otp}</strong>
          </div>
        </div>
      )}

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px 32px',
        background: 'rgba(30, 41, 59, 0.70)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.40), inset 0 0 0 1px rgba(148,163,184,0.08)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '2.5rem' }}>🔑</span>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#F8FAFC',
            letterSpacing: '-0.02em',
            margin: '12px 0 6px 0'
          }}>
            Reset Password
          </h1>
          <p style={{
            color: '#64748B',
            fontSize: '0.85rem',
            margin: 0
          }}>
            {step === 1 
              ? 'Enter email or phone number to receive a verification OTP'
              : 'Enter the verification OTP and your new password'
            }
          </p>
        </div>

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

        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.30)',
            color: '#A7F3D0',
            fontSize: '0.85rem',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="identifier" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Email or Phone Number
              </label>
              <input
                type="text"
                id="identifier"
                placeholder="name@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.60)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
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
                boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.35)'
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* OTP code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="otp" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                id="otp"
                maxLength={6}
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.60)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  fontWeight: 700
                }}
              />
            </div>

            {/* New Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="newPassword" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.60)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="confirmPassword" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.60)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
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
                boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.35)'
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            Remembered your password?{' '}
            <Link href="/login" style={{
              color: '#10B981',
              fontWeight: 700,
              textDecoration: 'none'
            }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
