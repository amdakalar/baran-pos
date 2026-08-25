import React from 'react';
import { User, SystemConfig } from '../types';

interface LoginModalProps {
  users: User[];
  systemConfig: SystemConfig;
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
  lang?: 'en' | 'ku';
  defaultUserId?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  systemConfig,
  onLoginSuccess,
  onCancel,
  lang = 'ku',
  defaultUserId,
}) => {
  const [uiLang, setUiLang] = React.useState<'ku' | 'en'>(lang);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const isRtl = uiLang === 'ku';

  const t = (ku: string, en: string) => (uiLang === 'ku' ? ku : en);

  // Pre-fill username if a defaultUserId is given
  React.useEffect(() => {
    if (defaultUserId) {
      const u = users.find((u) => u.id === defaultUserId);
      if (u) setUsername(u.name);
    }
  }, [defaultUserId, users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Find a matching user by name (case-insensitive) and PIN
    const matched = users.find(
      (u) =>
        u.name.toLowerCase().trim() === username.toLowerCase().trim() &&
        u.pin === password.trim()
    );

    if (matched) {
      onLoginSuccess(matched);
    } else {
      setError(t('ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە', 'Incorrect username or password'));
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPassword('');
    }
  };

  const shopTitle = uiLang === 'ku'
    ? systemConfig.shopNameKu || 'پەراوگەى باران'
    : systemConfig.shopNameEn || 'BARAN STATIONERY';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: '#eef1ec' }}
    >
      {/* Decorative background icons */}
      <svg
        className="pointer-events-none fixed inset-0 w-full h-full"
        viewBox="0 0 1000 600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="#2c2620"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.065 }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* pencil top-left */}
        <g transform="translate(90,70) rotate(25)">
          <rect x="0" y="0" width="18" height="90" rx="2" />
          <path d="M0 90 L9 112 L18 90 Z" />
          <line x1="0" y1="18" x2="18" y2="18" />
        </g>
        {/* paperclip top-right */}
        <g transform="translate(830,60) rotate(-10)">
          <path d="M0 40 L0 10 a12 12 0 0 1 24 0 L24 55 a20 20 0 0 1 -40 0 L-16 15" />
        </g>
        {/* scissors bottom-left */}
        <g transform="translate(120,470)">
          <circle cx="0" cy="0" r="10" />
          <circle cx="0" cy="40" r="10" />
          <line x1="8" y1="6" x2="70" y2="70" />
          <line x1="8" y1="34" x2="70" y2="-20" />
        </g>
        {/* push pin center-right */}
        <g transform="translate(760,420)">
          <circle cx="0" cy="0" r="12" />
          <line x1="0" y1="10" x2="0" y2="45" />
        </g>
        {/* notebook / lines bottom-right */}
        <g transform="translate(650,520)">
          <rect x="0" y="0" width="140" height="60" rx="4" />
          <line x1="15" y1="15" x2="125" y2="15" />
          <line x1="15" y1="30" x2="125" y2="30" />
          <line x1="15" y1="45" x2="90" y2="45" />
        </g>
        {/* binder clip top-center */}
        <g transform="translate(470,90)">
          <rect x="0" y="0" width="34" height="24" rx="3" />
          <path d="M6 0 C6 -18 28 -18 28 0" />
        </g>
      </svg>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm transition-all duration-150 ${shake ? 'animate-pulse' : ''}`}
        style={{
          background: '#ffffff',
          border: '1px solid #e4dfd6',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 16px 36px rgba(44,38,32,0.10)',
          padding: '48px 32px 36px',
          fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
        }}
      >
        {/* Language Toggle */}
        <button
          type="button"
          onClick={() => setUiLang((l) => (l === 'ku' ? 'en' : 'ku'))}
          style={{
            position: 'absolute',
            top: '14px',
            [isRtl ? 'left' : 'right']: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            border: '1px solid #ddd6ca',
            borderRadius: '20px',
            background: '#fbfaf8',
            color: '#6b6457',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#2c2620';
            (e.currentTarget as HTMLElement).style.color = '#2c2620';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#ddd6ca';
            (e.currentTarget as HTMLElement).style.color = '#6b6457';
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z" />
          </svg>
          <span>{uiLang === 'ku' ? 'EN' : 'کوردی'}</span>
        </button>

        {/* Title */}
        <h1
          style={{
            textAlign: 'center',
            color: '#2c2620',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '6px',
            letterSpacing: '0.3px',
          }}
        >
          {shopTitle}
        </h1>
        <p style={{ textAlign: 'center', color: '#8a8071', fontSize: '13px', marginBottom: '28px' }}>
          {t('چوونەژوورەوە بۆ سیستەم', 'Sign in to your account')}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder={t('ناوی بەکارهێنەر', 'Username')}
              required
              autoFocus
              style={{
                width: '100%',
                paddingBlock: '13px',
                paddingInlineStart: '16px',
                paddingInlineEnd: '45px',
                border: `1px solid ${error ? '#e5534b' : '#ddd6ca'}`,
                borderRadius: '3px',
                background: '#fbfaf8',
                color: '#2c2620',
                fontSize: '14px',
                outline: 'none',
                fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2c2620'; e.currentTarget.style.background = '#fff'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#e5534b' : '#ddd6ca'; e.currentTarget.style.background = '#fbfaf8'; }}
            />
            <span style={{ position: 'absolute', insetInlineEnd: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a8071', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
              </svg>
            </span>
          </div>

          {/* Password (PIN) */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={t('وشەی نهێنی (PIN)', 'Password (PIN)')}
              required
              maxLength={4}
              style={{
                width: '100%',
                paddingBlock: '13px',
                paddingInlineStart: '16px',
                paddingInlineEnd: '72px',
                border: `1px solid ${error ? '#e5534b' : '#ddd6ca'}`,
                borderRadius: '3px',
                background: '#fbfaf8',
                color: '#2c2620',
                fontSize: '14px',
                outline: 'none',
                letterSpacing: password && !showPass ? '6px' : '0',
                fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2c2620'; e.currentTarget.style.background = '#fff'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#e5534b' : '#ddd6ca'; e.currentTarget.style.background = '#fbfaf8'; }}
            />
            {/* Lock icon */}
            <span style={{ position: 'absolute', insetInlineEnd: '40px', top: '50%', transform: 'translateY(-50%)', color: '#8a8071', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10.5" width="14" height="9.5" rx="1.8" />
                <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            {/* Toggle show/hide */}
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              title={t(showPass ? 'شاردنەوە' : 'پیشاندان', showPass ? 'Hide' : 'Show')}
              style={{ position: 'absolute', insetInlineEnd: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8a8071', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              {showPass ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ color: '#c0392b', fontSize: '12px', marginBottom: '10px', padding: '6px 10px', background: '#fdf0ee', border: '1px solid #f5c6c1', borderRadius: '3px' }}>
              {error}
            </div>
          )}

          {/* Options row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6b6457', margin: '4px 2px 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#2c2620', cursor: 'pointer' }}
              />
              <span>{t('بمهێڵەوە', 'Remember me')}</span>
            </label>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{ color: '#6b6457', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #ccc4b6', padding: 0, fontFamily: 'inherit' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2c2620'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b6457'; }}
              >
                {t('پاشگەزبوونەوە', 'Cancel')}
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              border: 'none',
              borderRadius: '3px',
              background: '#2c2620',
              color: '#f7f5f2',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
              transition: 'background 0.25s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#46392c'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#2c2620'; }}
          >
            {t('چوونەژوورەوە', 'Login')}
          </button>
        </form>

        {/* Users hint */}
        <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '12px', color: '#a89f8f' }}>
          <span>{t('بەکارهێنەرەکان:', 'Available users:')}</span>
          {' '}
          {users.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setUsername(u.name)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                color: username === u.name ? '#2c2620' : '#a89f8f',
                fontWeight: username === u.name ? 700 : 400,
                fontSize: '12px',
                fontFamily: 'inherit',
                textDecoration: 'none',
                borderBottom: username === u.name ? '1px solid #2c2620' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2c2620'; }}
              onMouseLeave={(e) => { if (username !== u.name) (e.currentTarget as HTMLElement).style.color = '#a89f8f'; }}
            >
              {u.name}
            </button>
          )).reduce((acc: React.ReactNode[], el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} style={{ color: '#ccc4b6' }}> · </span>, el], [])}
        </div>
      </div>
    </div>
  );
};
