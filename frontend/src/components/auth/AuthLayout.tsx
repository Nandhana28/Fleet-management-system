import { ReactNode, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// ── Login Left Panel — Truck driving on a road ─────────────────────────────
const LoginPanel = ({ onHome }: { onHome: () => void }) => (
  <div style={{
    width: '42%', background: 'linear-gradient(160deg, #0a1628 0%, #0d1f2e 60%, #0a1628 100%)',
    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '32px 40px', flexShrink: 0,
  }}>
    <style>{`
      @keyframes truckDrive {
        0%   { transform: translateX(-110px); }
        100% { transform: translateX(360px); }
      }
      @keyframes roadDash {
        from { transform: translateX(0); }
        to   { transform: translateX(48px); }
      }
      @keyframes treePass {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-400px); }
      }
      @keyframes cloudDrift {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-300px); }
      }
      @keyframes wheelSpin {
        to { transform: rotate(360deg); }
      }
      @keyframes exhaustPuff {
        0%   { opacity: 0.6; transform: scaleX(1) translateX(0); }
        100% { opacity: 0; transform: scaleX(2) translateX(-8px); }
      }
      @keyframes starTwinkle {
        0%,100% { opacity: 0.2; } 50% { opacity: 0.8; }
      }
      @keyframes gaugeNeedle {
        0%,100% { transform: rotate(-40deg); } 50% { transform: rotate(20deg); }
      }
      @keyframes fuelDrop {
        0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); }
      }
    `}</style>

    {/* Subtle grid */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

    {/* Stars */}
    {[[15,8],[25,18],[60,6],[75,14],[88,9],[40,20],[55,25]].map(([l,t],i) => (
      <div key={i} style={{ position: 'absolute', left: `${l}%`, top: `${t}%`, width: 2, height: 2, borderRadius: '50%', background: '#fff', animation: `starTwinkle ${1.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }} />
    ))}

    {/* Glow */}
    <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)' }} />

    {/* Top bar */}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#0d9488', letterSpacing: '-0.5px' }}>FleetPulse</div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 1 }}>Real-time Fleet Intelligence</div>
      </div>
      <button onClick={onHome} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Home
      </button>
    </div>

    {/* Main animation — road scene */}
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24 }}>

      {/* Clouds drifting */}
      <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, overflow: 'hidden', height: 40 }}>
        <div style={{ display: 'flex', gap: 80, animation: 'cloudDrift 18s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', opacity: 0.15 }}>
              <div style={{ width: 32, height: 14, background: '#fff', borderRadius: 20 }} />
              <div style={{ width: 20, height: 10, background: '#fff', borderRadius: 20 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Road scene */}
      <div style={{ width: '100%', position: 'relative' }}>

        {/* Trees scrolling past */}
        <div style={{ position: 'absolute', bottom: 42, left: 0, right: 0, overflow: 'hidden', height: 50 }}>
          <div style={{ display: 'flex', gap: 60, animation: 'treePass 8s linear infinite', whiteSpace: 'nowrap' }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '28px solid rgba(13,148,136,0.5)' }} />
                <div style={{ width: 5, height: 10, background: 'rgba(13,148,136,0.3)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Road */}
        <div style={{ height: 42, background: '#1e293b', borderRadius: 4, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Road markings */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, transform: 'translateY(-50%)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 0, animation: 'roadDash 0.6s linear infinite' }}>
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{ width: 24, height: 3, background: 'rgba(255,255,255,0.25)', marginRight: 24, flexShrink: 0 }} />
              ))}
            </div>
          </div>

          {/* Truck */}
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', animation: 'truckDrive 4s linear infinite' }}>
            {/* Exhaust */}
            <div style={{ position: 'absolute', left: -14, top: 6, width: 14, height: 6, background: 'rgba(200,200,200,0.3)', borderRadius: 3, animation: 'exhaustPuff 0.6s ease-out infinite' }} />
            {/* Truck body */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
              {/* Cab */}
              <div style={{ width: 22, height: 22, background: '#0d9488', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, right: 3, width: 10, height: 7, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
              </div>
              {/* Cargo */}
              <div style={{ width: 44, height: 18, background: '#0f766e', borderRadius: '2px 2px 0 0', marginLeft: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 5 }}>
                  <div style={{ width: 3, height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
                  <div style={{ width: 3, height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
                  <div style={{ width: 3, height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
                </div>
              </div>
            </div>
            {/* Wheels */}
            {[10, 44, 56].map((l, i) => (
              <div key={i} style={{ position: 'absolute', bottom: -5, left: l, width: 10, height: 10, borderRadius: '50%', background: '#1e293b', border: '2px solid #475569', animation: 'wheelSpin 0.3s linear infinite' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: 3, height: 3, background: '#475569', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
            ))}
            {/* Headlight */}
            <div style={{ position: 'absolute', right: -4, top: 8, width: 4, height: 4, background: '#fef08a', borderRadius: '50%', boxShadow: '0 0 8px #fef08a' }} />
          </div>
        </div>

        {/* Ground */}
        <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: '0 0 4px 4px' }} />
      </div>

      {/* Floating instrument cards */}
      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        {/* Speed meter */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Speed</div>
          <div style={{ position: 'relative', width: 56, height: 28, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(13,148,136,0.3)' }} />
            <div style={{ position: 'absolute', bottom: 2, left: '50%', width: 2, height: 20, background: '#0d9488', transformOrigin: 'bottom center', animation: 'gaugeNeedle 3s ease-in-out infinite' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace', marginTop: 6 }}>52<span style={{ fontSize: 10, color: '#475569', marginLeft: 2 }}>km/h</span></div>
        </div>

        {/* Fuel gauge */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Fuel</div>
          <div style={{ animation: 'fuelDrop 2s ease-in-out infinite' }}>
            <svg width="28" height="32" viewBox="0 0 28 36" style={{ margin: '0 auto', display: 'block' }}>
              <rect x="8" y="0" width="12" height="20" rx="2" fill="none" stroke="rgba(13,148,136,0.4)" strokeWidth="1.5"/>
              <rect x="9" y="8" width="10" height="11" rx="1" fill="#0d9488" opacity="0.8"/>
              <line x1="14" y1="20" x2="14" y2="26" stroke="rgba(13,148,136,0.4)" strokeWidth="1.5"/>
              <ellipse cx="14" cy="28" rx="5" ry="3" fill="rgba(13,148,136,0.3)" stroke="rgba(13,148,136,0.4)" strokeWidth="1"/>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', fontFamily: 'monospace', marginTop: 4 }}>72<span style={{ fontSize: 10, color: '#475569', marginLeft: 2 }}>%</span></div>
        </div>

        {/* GPS ping */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Signal</div>
          <div style={{ position: 'relative', width: 32, height: 32, margin: '0 auto' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(13,148,136,0.4)', animation: `starTwinkle 2s ease-in-out ${i * 0.6}s infinite`, transform: `scale(${0.4 + i * 0.3})` }} />
            ))}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: '#0d9488' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', marginTop: 4 }}>10<span style={{ fontSize: 10, color: '#475569', marginLeft: 2 }}>live</span></div>
        </div>
      </div>
    </div>

    {/* Quote */}
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12, borderLeft: '2px solid rgba(13,148,136,0.4)', paddingLeft: 14 }}>
        "You shouldn't have to call your driver to know where he is."
      </div>
      <div style={{ fontSize: 11, color: '#334155' }}>— Built for Tamil Nadu fleet managers</div>
    </div>
  </div>
)

// ── Signup Left Panel — Map pin dropping on city grid ──────────────────────
const SignupPanel = ({ onHome }: { onHome: () => void }) => (
  <div style={{
    width: '42%', background: 'linear-gradient(160deg, #0a1628 0%, #0d1a2e 60%, #0a1628 100%)',
    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '32px 40px', flexShrink: 0,
  }}>
    <style>{`
      @keyframes pinDrop {
        0%   { transform: translateY(-60px); opacity: 0; }
        60%  { transform: translateY(4px); opacity: 1; }
        75%  { transform: translateY(-6px); }
        90%  { transform: translateY(2px); }
        100% { transform: translateY(0); opacity: 1; }
      }
      @keyframes ripple {
        0%   { transform: scale(0.3); opacity: 0.8; }
        100% { transform: scale(3); opacity: 0; }
      }
      @keyframes vehiclePop {
        0%   { opacity: 0; transform: scale(0); }
        70%  { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes routeLine {
        from { stroke-dashoffset: 120; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes cityGlow {
        0%,100% { opacity: 0.3; } 50% { opacity: 0.6; }
      }
      @keyframes dotPulse {
        0%,100% { transform: scale(1); opacity: 1; }
        50%     { transform: scale(1.5); opacity: 0.6; }
      }
    `}</style>

    {/* Background glow */}
    <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />
    <div style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 65%)' }} />

    {/* Top bar */}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#0d9488', letterSpacing: '-0.5px' }}>FleetPulse</div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 1 }}>Real-time Fleet Intelligence</div>
      </div>
      <button onClick={onHome} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Home
      </button>
    </div>

    {/* Main animation — city map with pin */}
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>

      {/* City grid map */}
      <div style={{ position: 'relative', width: 220, height: 200 }}>

        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px', borderRadius: 12 }} />

        {/* City blocks */}
        {[
          { x: 16, y: 20, w: 44, h: 30, c: 'rgba(99,102,241,0.15)' },
          { x: 72, y: 20, w: 32, h: 44, c: 'rgba(13,148,136,0.12)' },
          { x: 116, y: 20, w: 52, h: 30, c: 'rgba(99,102,241,0.1)' },
          { x: 16, y: 64, w: 32, h: 48, c: 'rgba(13,148,136,0.15)' },
          { x: 60, y: 76, w: 44, h: 36, c: 'rgba(99,102,241,0.12)' },
          { x: 116, y: 64, w: 52, h: 48, c: 'rgba(13,148,136,0.1)' },
          { x: 16, y: 124, w: 72, h: 32, c: 'rgba(99,102,241,0.1)' },
          { x: 100, y: 124, w: 68, h: 32, c: 'rgba(13,148,136,0.12)' },
          { x: 16, y: 168, w: 44, h: 24, c: 'rgba(99,102,241,0.08)' },
          { x: 72, y: 168, w: 96, h: 24, c: 'rgba(13,148,136,0.08)' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: b.c, borderRadius: 3, animation: `cityGlow ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }} />
        ))}

        {/* Route lines (SVG) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 220 200">
          <path d="M 40 140 L 40 80 L 90 80 L 90 110" stroke="rgba(13,148,136,0.5)" strokeWidth="2" fill="none" strokeDasharray="120" style={{ animation: 'routeLine 2s ease forwards 1s' }}/>
          <path d="M 160 160 L 160 100 L 130 100" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" strokeDasharray="120" style={{ animation: 'routeLine 2s ease forwards 1.5s' }}/>
        </svg>

        {/* Vehicle dots */}
        {[
          { x: 40, y: 138, c: '#10b981', delay: '1.2s' },
          { x: 160, y: 158, c: '#f59e0b', delay: '1.6s' },
          { x: 85, y: 52, c: '#10b981', delay: '2s' },
        ].map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: d.x - 5, top: d.y - 5, width: 10, height: 10, borderRadius: '50%', background: d.c, boxShadow: `0 0 8px ${d.c}`, animation: `vehiclePop 0.4s ease ${d.delay} both, dotPulse 2s ease-in-out ${d.delay} infinite` }} />
        ))}

        {/* Dropping pin — center of map */}
        <div style={{ position: 'absolute', left: '50%', top: '38%', transform: 'translateX(-50%)', animation: 'pinDrop 0.8s cubic-bezier(.36,.07,.19,.97) 0.3s both', zIndex: 10 }}>
          <svg width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#0d9488"/>
            <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
            <circle cx="16" cy="16" r="3" fill="#0d9488"/>
          </svg>
        </div>

        {/* Ripple rings under pin */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(13,148,136,0.5)', animation: `ripple 2s ease-out ${0.8 + i * 0.5}s infinite` }} />
        ))}
      </div>

      {/* Quote */}
      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <div style={{ fontSize: 22, fontFamily: "'DM Serif Display', serif", color: '#f1f5f9', lineHeight: 1.3, marginBottom: 10 }}>
          Every vehicle.<br />
          <span style={{ color: '#0d9488', fontStyle: 'italic' }}>Always in sight.</span>
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
          "Stop chasing your drivers with phone calls — let the map do the talking."
        </div>
      </div>
    </div>

    {/* Bottom stats */}
    <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
      {[
        { value: '10', label: 'Vehicles', color: '#0d9488' },
        { value: '5s', label: 'Updates', color: '#6366f1' },
        { value: '24/7', label: 'Monitoring', color: '#f59e0b' },
      ].map(({ value, label, color }) => (
        <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color, marginBottom: 3 }}>{value}</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{label}</div>
        </div>
      ))}
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
  const location = useLocation()
  const isSignup = location.pathname === '/signup'

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .auth-input { width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; color:#0f172a; font-family:inherit; background:#fff; transition:all 0.2s; outline:none; box-sizing:border-box; }
        .auth-input:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
        .auth-input::placeholder { color:#94a3b8; }
        .auth-btn-primary { width:100%; padding:12px; background:#0f172a; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .auth-btn-primary:hover { background:#1e293b; transform:translateY(-1px); }
        .social-btn { width:100%; padding:11px; background:#fff; color:#374151; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .social-btn:hover { border-color:#d1d5db; background:#f9fafb; }
        .auth-link { color:#0d9488; text-decoration:none; font-weight:500; font-size:14px; cursor:pointer; }
        .auth-link:hover { color:#0f766e; }
        .otp-input { width:48px; height:52px; text-align:center; font-size:22px; font-weight:700; border:1.5px solid #e5e7eb; border-radius:10px; font-family:monospace; color:#0f172a; outline:none; transition:all 0.2s; }
        .otp-input:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
      `}</style>

      {isSignup ? <SignupPanel onHome={() => navigate('/')} /> : <LoginPanel onHome={() => navigate('/')} />}

      {/* Right panel — tightened to not scroll */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 40px', background: '#fafaf9', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeSlideUp 0.5s ease' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6 }}>{title}</h1>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 300 }}>{subtitle}</p>
          </div>
          {children}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('/')}>← Back to home</span>
          </div>
        </div>
      </div>
    </div>
  )
}