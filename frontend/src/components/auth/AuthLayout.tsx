import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const LeftPanel = () => (
  <div style={{
    width: '45%', background: 'linear-gradient(155deg, #0f172a 0%, #0d2137 50%, #0f1f2e 100%)',
    position: 'relative', overflowY: 'auto', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '48px',
    flexShrink: 0,
  }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(13,148,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 65%)' }} />
    <div style={{ position: 'absolute', bottom: '-5%', right: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />

    <div style={{ position: 'relative' }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#0d9488', letterSpacing: '-0.5px', marginBottom: 8 }}>FleetPulse</div>
      <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>Real-time Fleet Intelligence</div>
    </div>

    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, padding: '40px 0' }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#f1f5f9', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16 }}>
          Complete visibility over<br />
          <span style={{ color: '#0d9488', fontStyle: 'italic' }}>every vehicle, every moment</span>
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, fontWeight: 300, maxWidth: 340 }}>
          Join transport managers who replaced spreadsheets and phone calls with live intelligence.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 10, color: '#0d9488', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Live Fleet Status</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Active', value: '10', color: '#10b981' },
            { label: 'Alerts', value: '5', color: '#ef4444' },
            { label: 'Avg Fuel', value: '68%', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {[
          { id: 'vehicle-01', reg: 'TN 33 CD 5678', status: 'moving', fuel: 72, color: '#10b981' },
          { id: 'vehicle-02', reg: 'TN 04 QR 4444', status: 'idle', fuel: 45, color: '#f59e0b' },
          { id: 'vehicle-05', reg: 'TN 33 EF 9012', status: 'alert', fuel: 8, color: '#ef4444' },
        ].map(v => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: v.color, boxShadow: `0 0 6px ${v.color}` }} />
              <div>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{v.reg}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{v.status}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 48, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${v.fuel}%`, height: '100%', background: v.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: v.color, fontFamily: 'monospace', width: 28 }}>{v.fuel}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14 }}>
        "Before FleetPulse, I spent 2 hours every morning just figuring out where my vehicles were. Now I know in 10 seconds."
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>R</div>
        <div>
          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>Rajesh Kumar</div>
          <div style={{ fontSize: 11, color: '#475569' }}>Transport Manager, Chennai Logistics</div>
        </div>
      </div>
    </div>
  </div>
)

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .auth-input { width:100%; padding:12px 16px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; color:#0f172a; font-family:inherit; background:#fff; transition:all 0.2s; outline:none; box-sizing:border-box; }
        .auth-input:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
        .auth-input::placeholder { color:#94a3b8; }
        .auth-btn-primary { width:100%; padding:13px; background:#0f172a; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .auth-btn-primary:hover { background:#1e293b; transform:translateY(-1px); box-shadow:0 6px 20px rgba(15,23,42,0.2); }
        .social-btn { width:100%; padding:12px; background:#fff; color:#374151; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .social-btn:hover { border-color:#d1d5db; background:#f9fafb; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.06); }
        .auth-link { color:#0d9488; text-decoration:none; font-weight:500; font-size:14px; transition:color 0.2s; cursor:pointer; }
        .auth-link:hover { color:#0f766e; }
        .otp-input { width:52px; height:56px; text-align:center; font-size:22px; font-weight:700; border:1.5px solid #e5e7eb; border-radius:10px; font-family:monospace; color:#0f172a; outline:none; transition:all 0.2s; }
        .otp-input:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
      `}</style>

      <LeftPanel />

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 40px', background: '#fafaf9', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeSlideUp 0.5s ease' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>{title}</h1>
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 300 }}>{subtitle}</p>
          </div>
          {children}
          <div style={{ marginTop: 28, textAlign: 'center', paddingBottom: 24 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('/')}>Back to FleetPulse</span>
          </div>
        </div>
      </div>
    </div>
  )
}