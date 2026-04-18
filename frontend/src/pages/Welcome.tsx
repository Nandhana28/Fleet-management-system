import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles } from '../hooks/useVehicles'
import { useAlerts, useResolveAlert } from '../hooks/useAlerts'

function useCounter(target: number, trigger: boolean, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger || target === 0) return
    let start = 0
    const step = target / (duration / 16)
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [trigger, target])
  return val
}

const SEVERITY_STYLE: Record<string, { bar: string; bg: string; badge: string; text: string }> = {
  critical: { bar: '#ef4444', bg: '#fff5f5', badge: 'bg-red-100 text-red-700',    text: 'text-red-700'    },
  high:     { bar: '#f97316', bg: '#fff7ed', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  medium:   { bar: '#eab308', bg: '#fefce8', badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-700' },
  low:      { bar: '#22c55e', bg: '#f0fdf4', badge: 'bg-green-100 text-green-700',  text: 'text-green-700'  },
}

export default function Welcome() {
  const navigate = useNavigate()
  const { data: vehicles } = useVehicles()
  const { data: alerts } = useAlerts()
  const { mutate: resolve, isPending: resolving } = useResolveAlert()
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  // Ensure vehicles is an array
  const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
  const alertsArray = Array.isArray(alerts) ? alerts : []
  
  const moving  = vehiclesArray.filter((v: any) => v.status === 'moving').length
  const idle    = vehiclesArray.filter((v: any) => v.status === 'idle').length
  const offline = vehiclesArray.filter((v: any) => v.status === 'offline').length
  const activeAlerts = alertsArray.length
  const total = vehiclesArray.length

  const c1 = useCounter(moving, statsVisible)
  const c2 = useCounter(idle, statsVisible)
  const c3 = useCounter(offline, statsVisible)
  const c4 = useCounter(activeAlerts, statsVisible)

  const vehicleList = vehiclesArray.slice(0, 6)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes truckGo  { 0%{left:-80px} 100%{left:calc(100% + 20px)} }
        @keyframes roadDash { from{transform:translateX(0)} to{transform:translateX(48px)} }
        @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .action-btn { transition:all 0.18s; cursor:pointer; border:none; font-family:inherit; }
        .action-btn:hover { transform:translateY(-2px); }
        .feature-row { transition:all 0.2s; }
        .feature-row:hover { background:#f8fffe !important; }
        .vehicle-row { transition:background 0.15s; }
        .vehicle-row:hover { background:#f0fdf9; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #fff 60%)', borderBottom: '1px solid #e5e7eb', padding: '56px 64px 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

          {/* Left */}
          <div style={{ opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.55s ease both' : 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>{total} vehicles live right now</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 18 }}>
              Good to have<br />
              you back. <span style={{ color: '#0d9488', fontStyle: 'italic' }}>⚡</span>
            </h1>
            <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.75, fontWeight: 300, marginBottom: 36, maxWidth: 420 }}>
              Your fleet is running. Vehicles are moving. Alerts are watching. Where do you want to go?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="action-btn"
                onClick={() => navigate('/dashboard')}
                style={{ background: '#0d9488', color: '#fff', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}
              >
                Open live map →
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/analytics')}
                style={{ background: '#fff', color: '#0f172a', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: '1.5px solid #e5e7eb' }}
              >
                View analytics
              </button>
            </div>
          </div>

          {/* Right — animated road card */}
          <div style={{ opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.55s 0.12s ease both' : 'none', animationFillMode: 'forwards' }}>
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
              {/* Card header */}
              <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {['#ef4444','#f59e0b','#10b981'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontFamily: 'monospace' }}>fleetpulse.live — Coimbatore</span>
              </div>
              {/* Map preview */}
              <div style={{ position: 'relative', height: 160, background: '#f8fafc', overflow: 'hidden' }}>
                {/* Grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Roads */}
                <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: 3, background: '#cbd5e1' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: 3, background: '#cbd5e1' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: 3, background: '#cbd5e1' }} />
                {/* Moving truck */}
                <div style={{ position: 'absolute', top: 'calc(40% - 8px)', animation: 'truckGo 3.5s linear infinite' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: 16, height: 14, background: '#0d9488', borderRadius: '3px 3px 0 0' }} />
                    <div style={{ width: 28, height: 10, background: '#0f766e', borderRadius: '2px 2px 0 0', marginLeft: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 1 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#334155', border: '1.5px solid #64748b' }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#334155', border: '1.5px solid #64748b' }} />
                  </div>
                </div>
                {/* Static pins */}
                {[{x:'28%',y:'25%',c:'#f59e0b'},{x:'62%',y:'65%',c:'#10b981'},{x:'78%',y:'30%',c:'#ef4444'}].map((p,i) => (
                  <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, animation: `floatUp ${2.5+i*0.4}s ease-in-out ${i*0.3}s infinite` }}>
                    <svg width="18" height="24" viewBox="0 0 18 24">
                      <path d="M9 0C4.03 0 0 4.03 0 9c0 6.75 9 15 9 15S18 15.75 18 9c0-4.97-4.03-9-9-9z" fill={p.c}/>
                      <circle cx="9" cy="9" r="3.5" fill="white"/>
                    </svg>
                  </div>
                ))}
              </div>
              {/* Stats strip */}
              <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Moving',  val: moving,       dot: '#10b981' },
                  { label: 'Idle',    val: idle,         dot: '#f59e0b' },
                  { label: 'Alerts',  val: activeAlerts, dot: activeAlerts > 0 ? '#ef4444' : '#10b981' },
                ].map(({ label, val, dot }, i) => (
                  <div key={label} style={{ flex: 1, padding: '14px 16px', borderRight: i < 2 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <div ref={statsRef} style={{ background: '#0d9488', padding: '32px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'Vehicles online',   val: c1, suffix: `/${total}`,  sub: 'currently moving' },
            { label: 'Vehicles idle',     val: c2, suffix: '',           sub: 'engine on, parked' },
            { label: 'Vehicles offline',  val: c3, suffix: '',           sub: 'no GPS signal' },
            { label: 'Active alerts',     val: c4, suffix: '',           sub: activeAlerts > 0 ? 'need attention' : 'all clear ✓' },
          ].map(({ label, val, suffix, sub }, i) => (
            <div key={label} style={{ padding: '0 32px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none', textAlign: i === 0 ? 'left' : 'center' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>
                {val}<span style={{ fontSize: 18, opacity: 0.6 }}>{suffix}</span>
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ALERTS ────────────────────────────────────────────────── */}
      <div style={{ padding: '40px 64px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: alertsArray.length > 0 ? '#ef4444' : '#0d9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
                {alertsArray.length > 0 ? `${alertsArray.length} Active Alert${alertsArray.length > 1 ? 's' : ''}` : 'Fleet Status'}
              </p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {alertsArray.length > 0 ? 'Needs your attention' : 'All clear — no active alerts'}
              </h2>
            </div>
            {alertsArray.length > 0 && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Click Resolve after taking action</span>
            )}
          </div>

          {alertsArray.length === 0 ? (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✅</div>
              <div>
                <p style={{ fontWeight: 600, color: '#166534', fontSize: 15 }}>Fleet is running clean</p>
                <p style={{ color: '#4ade80', fontSize: 13, marginTop: 2 }}>No overspeeding, no fuel anomalies, no route breaches right now.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertsArray.slice(0, 6).map((alert: any) => {
                const sev = (alert.severity || 'medium').toLowerCase()
                const barColor = sev === 'critical' ? '#ef4444' : sev === 'high' ? '#f97316' : sev === 'medium' ? '#eab308' : '#22c55e'
                const bgColor  = sev === 'critical' ? '#fff5f5' : sev === 'high' ? '#fff7ed' : sev === 'medium' ? '#fefce8' : '#f0fdf4'
                const isThis   = resolvingId === alert.alert_id
                return (
                  <div key={alert.alert_id} style={{ background: bgColor, border: '1px solid #e5e7eb', borderLeft: `4px solid ${barColor}`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, background: `${barColor}18`, color: barColor }}>{sev}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{alert.vehicle_id}</span>
                        <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '1px 8px', borderRadius: 100 }}>{alert.alert_type}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{alert.message}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    <button
                      disabled={isThis || resolving}
                      onClick={() => {
                        setResolvingId(alert.alert_id)
                        resolve(alert.alert_id, { onSettled: () => setResolvingId(null) })
                      }}
                      style={{ flexShrink: 0, background: isThis ? '#e5e7eb' : '#0d9488', color: isThis ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: isThis ? 'default' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    >
                      {isThis ? 'Resolving…' : '✓ Resolve'}
                    </button>
                  </div>
                )
              })}
              {alertsArray.length > 6 && (
                <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                  +{alertsArray.length - 6} more — <span style={{ color: '#0d9488', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/dashboard')}>view all</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACCESS ──────────────────────────────────────── */}
      <div style={{ padding: '64px 64px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Quick access</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#0f172a', letterSpacing: '-1px' }}>Where do you want to go?</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
            {[
              {
                num: '01', title: 'Live Dashboard', sub: 'Real-time map · vehicle popups · route lines · GPS positions every 5s',
                tag: `${moving} moving`, tagColor: '#0d9488', tagBg: '#f0fdf9',
                path: '/dashboard',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              },
              {
                num: '02', title: 'Analytics', sub: 'Fuel trends · trip counts · driver leaderboard · anomaly detection',
                tag: `${total} vehicles`, tagColor: '#6366f1', tagBg: '#eef2ff',
                path: '/analytics',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              },
              {
                num: '03', title: 'AI Agent', sub: 'Ask anything · "which vehicle has low fuel?" · fleet queries in plain English',
                tag: 'Ask anything', tagColor: '#f59e0b', tagBg: '#fffbeb',
                path: '/agent',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              },
              {
                num: '04', title: 'Settings', sub: 'Alert thresholds · WhatsApp notifications · email alerts · toggle rules',
                tag: 'Configure', tagColor: '#64748b', tagBg: '#f8fafc',
                path: '/settings',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              },
            ].map((row, i) => (
              <div
                key={row.title}
                className="feature-row"
                onClick={() => navigate(row.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '22px 28px', background: '#fff', cursor: 'pointer', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}
              >
                <span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 700, fontFamily: 'monospace', width: 24, flexShrink: 0 }}>{row.num}</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: row.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>{row.title}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 300 }}>{row.sub}</p>
                </div>
                <span style={{ fontSize: 11, color: row.tagColor, background: row.tagBg, border: `1px solid ${row.tagColor}22`, borderRadius: 100, padding: '4px 12px', fontWeight: 600, flexShrink: 0 }}>
                  {row.tag}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE VEHICLE TABLE ─────────────────────────────────── */}
      {vehicleList.length > 0 && (
        <div style={{ padding: '56px 64px 64px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Right now</p>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#0f172a', letterSpacing: '-1px' }}>Live vehicle feed</h2>
              </div>
              <button onClick={() => navigate('/dashboard')} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Open full map →
              </button>
            </div>

            <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px', gap: 0, padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Vehicle', 'Registration', 'Speed', 'Fuel', 'Status'].map(h => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</p>
                ))}
              </div>
              {vehicleList.map((v: any, i: number) => {
                const loc = v.current_location
                const statusColor = v.status === 'moving' ? '#10b981' : v.status === 'idle' ? '#f59e0b' : '#94a3b8'
                const statusBg    = v.status === 'moving' ? '#f0fdf4' : v.status === 'idle' ? '#fffbeb' : '#f8fafc'
                return (
                  <div
                    key={v.vehicle_id}
                    className="vehicle-row"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px', gap: 0, padding: '16px 24px', borderBottom: i < vehicleList.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', background: '#fff' }}
                    onClick={() => navigate('/dashboard')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth={2}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{v.vehicle_id}</p>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>{v.registration}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: loc?.speed > 80 ? '#ef4444' : '#0f172a', alignSelf: 'center', fontFamily: 'monospace' }}>
                      {loc?.speed ?? '—'} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>km/h</span>
                    </p>
                    <div style={{ alignSelf: 'center' }}>
                      {loc?.fuel_level != null ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', width: 48 }}>
                              <div style={{ width: `${loc.fuel_level}%`, height: '100%', background: loc.fuel_level < 20 ? '#ef4444' : '#0d9488', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: loc.fuel_level < 20 ? '#ef4444' : '#64748b', fontFamily: 'monospace' }}>{loc.fuel_level}%</span>
                          </div>
                        </div>
                      ) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <span style={{ fontSize: 11, color: statusColor, background: statusBg, border: `1px solid ${statusColor}33`, borderRadius: 100, padding: '4px 12px', fontWeight: 600, textTransform: 'capitalize' }}>
                        ● {v.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}