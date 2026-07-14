import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>OICT Education</title>
        <meta name="description" content="Learn anywhere, anytime — OICT Education Platform" />

        {/* Preload Google Font for faster text rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        {/* ── Instant loading splash shown BEFORE the JS bundle loads ── */}
        <div id="splash-screen">
          <div id="splash-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="#6366f1"/>
              <path d="M24 10L36 17V31L24 38L12 31V17L24 10Z" fill="white" fillOpacity="0.9"/>
              <path d="M24 16L30 19.5V26.5L24 30L18 26.5V19.5L24 16Z" fill="#6366f1"/>
            </svg>
          </div>
          <div id="splash-title">OICT Education</div>
          <div id="splash-spinner">
            <div id="spinner-ring"></div>
          </div>
          <div id="splash-hint">Loading your learning platform…</div>
        </div>

        {children}
      </body>
    </html>
  );
}

const styles = `
  /* ── Base ─────────────────────────────────────────────── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: #f9fafb;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  @media (prefers-color-scheme: dark) {
    body { background-color: #111827; }
  }

  /* ── Splash Screen ─────────────────────────────────────── */
  #splash-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  @media (prefers-color-scheme: dark) {
    #splash-screen {
      background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%);
    }
  }

  /* Hide splash once React has mounted */
  body.app-ready #splash-screen {
    opacity: 0;
    pointer-events: none;
    transform: scale(1.04);
  }

  #splash-logo {
    animation: pulse 2s ease-in-out infinite;
  }

  #splash-title {
    font-size: 22px;
    font-weight: 900;
    color: #6366f1;
    letter-spacing: -0.5px;
  }

  #splash-hint {
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
    margin-top: -4px;
  }

  /* ── Spinner ─────────────────────────────────────────── */
  #splash-spinner {
    width: 36px;
    height: 36px;
    position: relative;
  }

  #spinner-ring {
    width: 36px;
    height: 36px;
    border: 3px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  /* ── Hide splash after app mounts ───────────────────── */
  /* Injected via inline script below in body */
`;

