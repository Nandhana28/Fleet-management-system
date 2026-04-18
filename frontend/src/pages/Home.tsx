import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

const useCounter = (target: number, inView: boolean, duration = 1800) => {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [inView, target, duration])
  return val
}

const painPoints = [
  { title: "You call. They don't answer.", body: "Tracking 10 vehicles means 10 phone calls per hour. You never actually know where they are — you know where they said they were.", fix: "Live GPS positions updated every 5 seconds. No calls. No guessing. Every vehicle pinned on a map, right now.", tag: 'Location Tracking' },
  { title: 'Fuel receipts in a shoebox.', body: 'Month-end means three days reconstructing fuel spend from paper receipts, driver claims, and gut feeling. Leakage is invisible.', fix: 'Every litre logged automatically per trip. Anomalies flagged instantly. Your fuel budget is finally visible.', tag: 'Fuel Analytics' },
  { title: 'You find out after the accident.', body: 'Speeding, harsh braking, low fuel — you only hear about it when something breaks. By then, the damage is done.', fix: 'Real-time alerts the moment a threshold is crossed. You intervene before it becomes an incident.', tag: 'Smart Alerts' },
  { title: 'No idea who your worst driver is.', body: "Everyone says they drive fine. You have no data to argue. The reckless driver keeps driving until the inevitable happens.", fix: "Every driver scored per trip — speed, braking, idle time. The leaderboard doesn't lie.", tag: 'Driver Scorecards' },
  { title: 'Monthly reports take days.', body: 'Your manager wants a fleet summary. You spend three days copying numbers from spreadsheets into slides. Then they change a date.', fix: 'Reports generated automatically. PDF ready in one click. Always accurate, always current.', tag: 'Automated Reports' },
  { title: 'Detours with no accountability.', body: 'Vehicles take unofficial routes. Personal errands on company time. You find out when the fuel bill arrives.', fix: 'Geofence any zone. The second a vehicle crosses the boundary, you know. Timestamped, logged, irrefutable.', tag: 'Geofencing' },
]

const MapVisual = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
    {[
      { top: '28%', left: '32%', color: '#10b981', delay: '0s', label: 'Moving · 52 km/h' },
      { top: '55%', left: '58%', color: '#10b981', delay: '0.4s', label: 'Moving · 38 km/h' },
      { top: '42%', left: '22%', color: '#f59e0b', delay: '0.8s', label: 'Idle · 0 km/h' },
      { top: '65%', left: '40%', color: '#10b981', delay: '1.2s', label: 'Moving · 61 km/h' },
      { top: '20%', left: '65%', color: '#ef4444', delay: '0.2s', label: 'Alert · Low Fuel' },
    ].map((m, i) => (
      <div key={i} style={{ position: 'absolute', top: m.top, left: m.left }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, animation: `mapPulse 2s ease-out ${m.delay} infinite` }} />
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.9)', border: `1px solid ${m.color}33`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap', fontSize: 9, color: m.color, fontFamily: 'monospace' }}>{m.label}</div>
      </div>
    ))}
    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
      {[['10', 'Active'], ['5', 'Alerts'], ['47', 'Avg km/h']].map(([v, l]) => (
        <div key={l} style={{ textAlign: 'center' }}>
          <div style={{ color: '#0d9488', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ color: '#475569', fontSize: 10 }}>{l}</div>
        </div>
      ))}
    </div>
  </div>
)

const AlertVisual = () => (
  <div style={{ width: '100%', height: '100%', background: '#0f172a', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[
      { color: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.18)', label: 'CRITICAL', title: 'Vehicle-05 fuel at 8%', sub: 'TN 33 EF 9012  ·  2 mins ago' },
      { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', label: 'HIGH', title: 'Vehicle-02 speed 94 km/h', sub: 'TN 04 QR 4444  ·  4 mins ago' },
      { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', label: 'HIGH', title: 'Vehicle-08 geofence breach', sub: 'TN 38 IJ 7890  ·  7 mins ago' },
      { color: '#6366f1', bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.18)', label: 'MEDIUM', title: 'Vehicle-01 idle 22 mins', sub: 'TN 33 CD 5678  ·  9 mins ago' },
    ].map((a, i) => (
      <div key={i} style={{ background: a.bg, border: `1px solid ${a.border}`, borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: a.color, letterSpacing: 1, fontFamily: 'monospace' }}>{a.label}</span>
            <span style={{ fontSize: 12, color: '#e2e8f0' }}>{a.title}</span>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, animation: 'pulse-dot 2s infinite' }} />
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{a.sub}</div>
      </div>
    ))}
  </div>
)

const AgentVisual = () => (
  <div style={{ width: '100%', height: '100%', background: '#0f172a', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
    {[
      { role: 'user', msg: 'Which vehicle has the lowest fuel right now?' },
      { role: 'agent', msg: 'Vehicle-05 is at 8% fuel — TN 33 EF 9012, currently near Gandhipuram. Recommend immediate refuel stop.' },
      { role: 'user', msg: 'Who was driving vehicle-3 at 2pm yesterday?' },
      { role: 'agent', msg: 'Driver-3 (Ramesh K.) was operating vehicle-3 at 14:00. Trip logged: RS Puram → Peelamedu, 18.4 km.' },
    ].map((m, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div style={{ maxWidth: '82%', background: m.role === 'user' ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.role === 'user' ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '8px 12px', fontSize: 11, color: m.role === 'user' ? '#5eead4' : '#cbd5e1', lineHeight: 1.55 }}>{m.msg}</div>
      </div>
    ))}
  </div>
)

export default function Home() {
  const navigate = useNavigate()
  const statsSection = useInView()
  const v1 = useCounter(23, statsSection.inView)
  const v2 = useCounter(3, statsSection.inView)
  const v3 = useCounter(68, statsSection.inView)
  const v4 = useCounter(4, statsSection.inView)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')

  const goToDashboard = () => navigate('/login')

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes mapPulse { 0%{transform:scale(1);opacity:1} 70%{transform:scale(3);opacity:0} 100%{transform:scale(1);opacity:0} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        .btn-primary { background:#0d9488;color:#fff;border:none;padding:14px 28px;borderRadius:10px;fontSize:14px;fontWeight:600;cursor:pointer;fontFamily:inherit;transition:all 0.2s; }
        .btn-primary:hover { background:#0f766e;transform:translateY(-1px); }
        .btn-outline { background:transparent;color:#0d9488;border:1.5px solid #0d9488;padding:13px 28px;borderRadius:10px;fontSize:14px;fontWeight:600;cursor:pointer;fontFamily:inherit;transition:all 0.2s; }
        .btn-outline:hover { background:#f0fdf9; }
        .social-btn { display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px 16px;border:1.5px solid #e5e7eb;borderRadius:10px;background:#fff;fontSize:14px;fontWeight:500;color:#374151;cursor:pointer;fontFamily:inherit;transition:all 0.2s; }
        .social-btn:hover { border-color:#d1d5db;background:#f9fafb; }
        .auth-input { width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;borderRadius:10px;fontSize:14px;fontFamily:inherit;color:#0f172a;outline:none;transition:border 0.2s;box-sizing:border-box; }
        .auth-input:focus { border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
        .auth-btn-primary { width:100%;padding:13px;background:#0d9488;color:#fff;border:none;borderRadius:10px;fontSize:15px;fontWeight:600;cursor:pointer;fontFamily:inherit;transition:all 0.2s; }
        .auth-btn-primary:hover { background:#0f766e; }
        .auth-link { color:#0d9488;fontWeight:600;cursor:pointer; }
        .auth-link:hover { textDecoration:underline; }
        .otp-input { width:46px;height:54px;textAlign:center;fontSize:22px;fontWeight:700;border:2px solid #e5e7eb;borderRadius:10px;outline:none;fontFamily:inherit;color:#0f172a;transition:all 0.2s; }
        .otp-input:focus { border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
        .card-flip { perspective:1000px;cursor:pointer; }
        .card-inner { position:relative;width:100%;height:100%;transition:transform 0.55s cubic-bezier(.4,0,.2,1);transform-style:preserve-3d; }
        .card-inner.flipped { transform:rotateY(180deg); }
        .card-face { position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;padding:28px;display:flex;flex-direction:column; }
        .card-back { transform:rotateY(180deg); }
        .pain-card:hover .card-inner:not(.flipped) { transform:translateY(-4px); }
        .feature-card { transition:transform 0.2s; }
        .feature-card:hover { transform:translateY(-2px); }
        .stat-card { transition:transform 0.2s; }
        .stat-card:hover { transform:translateY(-4px); }
        .feature-visual { background:rgba(255,255,255,0.02); }
        nav a { text-decoration:none; }
        .contact-input { width:100%;padding:12px 16px;border:1.5px solid #e2e8f0;borderRadius:10px;fontSize:14px;fontFamily:inherit;color:#0f172a;outline:none;transition:border 0.2s;box-sizing:border-box;background:#fff; }
        .contact-input:focus { border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", color: '#0d9488', fontSize: 22, cursor: 'pointer' }} onClick={() => navigate('/')}>FleetPulse</div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[['#problems', 'Problems'], ['#solution', 'Platform'], ['#results', 'Results'], ['#contact', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 14, color: '#475569', fontWeight: 500, textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-outline" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }} onClick={goToDashboard}>Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '120px 56px 100px', background: 'linear-gradient(160deg, #fafffe 0%, #f0fdfa 50%, #fafaf9 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 100, padding: '6px 14px', marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, letterSpacing: 0.5 }}>Live · 10 vehicles tracked right now</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(40px, 5vw, 68px)', color: '#0f172a', lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24 }}>
              Your fleet.<br />
              <span style={{ color: '#0d9488' }}>Under control.</span><br />
              Right now.
            </h1>
            <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, marginBottom: 40, fontWeight: 300, maxWidth: 480 }}>
              Real-time GPS tracking, fuel anomaly detection, driver scorecards, and an AI agent — built for logistics businesses in Tamil Nadu.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: 15, padding: '15px 32px' }} onClick={goToDashboard}>
                See live dashboard →
              </button>
              <button className="btn-outline" style={{ fontSize: 15, padding: '15px 32px' }} onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}>
                How it works
              </button>
            </div>
            <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
              {[['10', 'Vehicles tracked'], ['5s', 'Update interval'], ['24/7', 'Monitoring']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'DM Serif Display', serif" }}>{v}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 420, animation: 'fadeUp 0.7s 0.15s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            <MapVisual />
          </div>
        </div>
      </div>

      {/* PAIN POINTS */}
      <div id="problems" style={{ padding: '110px 56px', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#ef4444', marginBottom: 18, textTransform: 'uppercase' }}>The Problem</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', color: '#0f172a', lineHeight: 1.1, maxWidth: 640, letterSpacing: '-1.5px' }}>
              Running a fleet without real-time data feels like this.
            </h2>
            <p style={{ color: '#64748b', marginTop: 16, fontSize: 15, fontWeight: 300 }}>Click a card to see how FleetPulse solves it.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {painPoints.map((p, i) => (
              <div key={i} className="card-flip pain-card" style={{ height: 230 }} onClick={() => setFlipped(prev => ({ ...prev, [i]: !prev[i] }))}>
                <div className={`card-inner ${flipped[i] ? 'flipped' : ''}`}>
                  <div className="card-face" style={{ background: '#fff', border: '1.5px solid #fee2e2', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#fca5a5', textTransform: 'uppercase', marginBottom: 12 }}>{p.tag}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', lineHeight: 1.4, marginBottom: 10 }}>{p.title}</div>
                      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{p.body}</p>
                    </div>
                    <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #fca5a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>↻</span>
                      FLIP FOR THE FIX
                    </div>
                  </div>
                  <div className="card-face card-back" style={{ background: '#f0fdf9', border: '1.5px solid #99f6e4', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#0d9488', textTransform: 'uppercase', marginBottom: 12 }}>With FleetPulse</div>
                      <p style={{ fontSize: 14, color: '#134e4a', lineHeight: 1.7 }}>{p.fix}</p>
                    </div>
                    <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 600, letterSpacing: 1 }}>PROBLEM SOLVED</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOLUTION / FEATURES */}
      <div id="solution" style={{ padding: '110px 56px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#0d9488', marginBottom: 18, textTransform: 'uppercase' }}>The Platform</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(34px, 4vw, 56px)', color: '#f1f5f9', lineHeight: 1.1, maxWidth: 580, letterSpacing: '-1.5px' }}>
              Everything you need to run a fleet with confidence
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {[
              { tag: 'Live Intelligence', title: 'A map that thinks', body: "Not just dots on a map. Every marker carries live speed, fuel level, driver ID, and alert status. Click any vehicle for a full snapshot — no page load, no refresh.", visual: 'map' },
              { tag: 'Predictive Alerts', title: 'Know before it happens', body: "FleetPulse monitors 12 parameters simultaneously. Fuel dropping below threshold, speed crossing the limit, vehicle leaving a zone — alerts reach you in under 3 seconds.", visual: 'alert' },
              { tag: 'AI Fleet Agent', title: 'Ask your fleet a question', body: "Type in plain English. \"Which vehicle has the lowest fuel?\" \"Who was driving vehicle-3 at 2pm?\" The agent searches, reasons, and responds — no dashboard navigation needed.", visual: 'agent' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', minHeight: 340 }}>
                <div style={{ padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#0d9488', textTransform: 'uppercase', marginBottom: 20 }}>{f.tag}</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 18, letterSpacing: '-0.5px' }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.75, fontWeight: 300, maxWidth: 400 }}>{f.body}</p>
                  <button className="btn-primary" style={{ marginTop: 32, alignSelf: 'flex-start', fontSize: 13, padding: '10px 22px', background: '#0d9488' }} onClick={goToDashboard}>
                    See it live
                  </button>
                </div>
                <div className="feature-visual" style={{ padding: 24, order: i % 2 === 0 ? 1 : 0, minHeight: 280 }}>
                  {f.visual === 'map' && <MapVisual />}
                  {f.visual === 'alert' && <AlertVisual />}
                  {f.visual === 'agent' && <AgentVisual />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div id="results" ref={statsSection.ref} style={{ padding: '110px 56px', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#0d9488', marginBottom: 18, textTransform: 'uppercase' }}>Measured Impact</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', color: '#0f172a', marginBottom: 72, letterSpacing: '-1.5px' }}>
            Numbers that matter to a transport manager
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { value: v1, suffix: '%', label: 'reduction in fuel costs', color: '#10b981' },
              { value: v2, suffix: ' hrs', label: 'saved daily on manual work', color: '#6366f1' },
              { value: v3, suffix: '%', label: 'faster incident response', color: '#f59e0b' },
              { value: v4, suffix: 'x', label: 'better driver accountability', color: '#0d9488' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 20, padding: '48px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: s.color, lineHeight: 1, letterSpacing: '-2px' }}>{s.value}{s.suffix}</div>
                <div style={{ color: '#64748b', fontSize: 14, marginTop: 14, lineHeight: 1.5, fontWeight: 300 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', padding: '110px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff', marginBottom: 20, letterSpacing: '-2px', lineHeight: 1.1 }}>
            Your fleet is out there right now.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 19, marginBottom: 44, fontWeight: 300 }}>Stop guessing. Start knowing.</p>
          <button
            onClick={goToDashboard}
            style={{ background: '#fff', color: '#0d9488', border: 'none', padding: '18px 44px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Open Live Dashboard
          </button>
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" style={{ padding: '110px 56px', background: '#fff' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

          {/* Left — info */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#0d9488', marginBottom: 18, textTransform: 'uppercase' }}>Contact</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3vw, 44px)', color: '#0f172a', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 20 }}>
              Get in touch with the team
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, fontWeight: 300, marginBottom: 40 }}>
              Have questions about FleetPulse or want to see a live demo? Drop us a message and we'll get back to you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  label: 'Location',
                  value: 'Coimbatore, Tamil Nadu',
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                  label: 'Email',
                  value: 'hello@fleetpulse.io',
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>,
                  label: 'GitHub',
                  value: 'github.com/fleetpulse/fleet-management-system',
                },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf9', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 14, color: '#374151' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right — form */}
          <div style={{ background: '#fafaf9', border: '1px solid #f1f5f9', borderRadius: 20, padding: 40 }}>
            {contactSent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf9', border: '1px solid #99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Message sent!</h3>
                <p style={{ fontSize: 14, color: '#64748b' }}>We'll get back to you within 24 hours.</p>
                <button className="btn-primary" style={{ marginTop: 24, fontSize: 13, padding: '10px 24px' }} onClick={() => { setContactSent(false); setContactError('') }}>Send another</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Send us a message</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>We typically respond within a day.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your name</label>
                    <input className="contact-input" type="text" placeholder="Rajesh Kumar" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                    <input className="contact-input" type="email" placeholder="you@company.com" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                    <textarea
                      className="contact-input"
                      placeholder="Tell us about your fleet or what you'd like to know..."
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      rows={5}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  {contactError && (
                    <p style={{ fontSize: 13, color: '#ef4444', marginTop: -4 }}>{contactError}</p>
                  )}
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: 4, opacity: contactLoading ? 0.7 : 1 }}
                    disabled={contactLoading}
                    onClick={async () => {
                      setContactError('')
                      if (!contactForm.name || !contactForm.email || !contactForm.message) {
                        setContactError('Please fill in all fields.')
                        return
                      }
                      setContactLoading(true)
                      try {
                        const res = await fetch(`${API_BASE}/contact`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(contactForm),
                        })
                        if (!res.ok) throw new Error('Failed')
                        setContactSent(true)
                        setContactForm({ name: '', email: '', message: '' })
                      } catch {
                        setContactError('Something went wrong. Please try again.')
                      } finally {
                        setContactLoading(false)
                      }
                    }}
                  >
                    {contactLoading ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#0a0f1e', padding: '28px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", color: '#0d9488', fontSize: 20 }}>FleetPulse</div>
        <div style={{ color: '#334155', fontSize: 13 }}>Real-time Fleet Intelligence Platform — PSG Tech</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</span>
          <span style={{ fontSize: 13, color: '#0d9488', cursor: 'pointer' }} onClick={goToDashboard}>Get started</span>
        </div>
      </div>
    </div>
  )
}