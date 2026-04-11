import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  {
    title: "You call. They don't answer.",
    body: "Tracking 10 vehicles means 10 phone calls per hour. You never actually know where they are — you know where they said they were.",
    fix: "Live GPS positions updated every 5 seconds. No calls. No guessing. Every vehicle pinned on a map, right now.",
    tag: 'Location Tracking',
  },
  {
    title: 'Fuel receipts in a shoebox.',
    body: 'Month-end means three days reconstructing fuel spend from paper receipts, driver claims, and gut feeling. Leakage is invisible.',
    fix: 'Every litre logged automatically per trip. Anomalies flagged instantly. Your fuel budget is finally visible.',
    tag: 'Fuel Analytics',
  },
  {
    title: 'You find out after the accident.',
    body: 'Speeding, harsh braking, low fuel — you only hear about it when something breaks. By then, the damage is done.',
    fix: 'Real-time alerts the moment a threshold is crossed. You intervene before it becomes an incident.',
    tag: 'Smart Alerts',
  },
  {
    title: 'No idea who your worst driver is.',
    body: "Everyone says they drive fine. You have no data to argue. The reckless driver keeps driving until the inevitable happens.",
    fix: "Every driver scored per trip — speed, braking, idle time. The leaderboard doesn't lie.",
    tag: 'Driver Scorecards',
  },
  {
    title: 'Monthly reports take days.',
    body: 'Your manager wants a fleet summary. You spend three days copying numbers from spreadsheets into slides. Then they change a date.',
    fix: 'Reports generated automatically. PDF ready in one click. Always accurate, always current.',
    tag: 'Automated Reports',
  },
  {
    title: 'Detours with no accountability.',
    body: 'Vehicles take unofficial routes. Personal errands on company time. You find out when the fuel bill arrives.',
    fix: 'Geofence any zone. The second a vehicle crosses the boundary, you know. Timestamped, logged, irrefutable.',
    tag: 'Geofencing',
  },
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
      { role: 'user', text: "Which vehicle has the lowest fuel right now?" },
      { role: 'agent', text: "Vehicle-05 (TN 33 EF 9012) is at 8% fuel — critically low. It's moving near Peelamedu. Recommend immediate refuelling stop." },
      { role: 'user', text: "How many alerts fired this week?" },
      { role: 'agent', text: "23 alerts total — 4 critical, 11 high, 8 medium. Fuel-related alerts account for 52% of all incidents." },
    ].map((m, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div style={{
          maxWidth: '82%', padding: '9px 13px',
          borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: m.role === 'user' ? '#0d9488' : 'rgba(255,255,255,0.05)',
          border: m.role === 'agent' ? '1px solid rgba(255,255,255,0.07)' : 'none',
          fontSize: 12, color: m.role === 'user' ? '#fff' : '#cbd5e1', lineHeight: 1.55,
        }}>
          {m.text}
        </div>
      </div>
    ))}
    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 12px', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#334155', flex: 1 }}>Ask about your fleet...</span>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid white', marginLeft: 2 }} />
      </div>
    </div>
  </div>
)

export default function Home() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const statsSection = useInView()
  const v1 = useCounter(40, statsSection.inView)
  const v2 = useCounter(3, statsSection.inView, 1200)
  const v3 = useCounter(60, statsSection.inView)
  const v4 = useCounter(10, statsSection.inView, 1400)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fafaf9', color: '#0f172a', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes mapPulse { 0%{box-shadow:0 0 0 0 currentColor} 70%{box-shadow:0 0 0 10px transparent} 100%{box-shadow:0 0 0 0 transparent} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .card-flip { perspective:1200px; cursor:pointer; }
        .card-inner { position:relative; width:100%; height:100%; transition:transform 0.65s cubic-bezier(0.4,0,0.2,1); transform-style:preserve-3d; }
        .card-inner.flipped { transform:rotateY(180deg); }
        .card-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:16px; padding:28px; display:flex; flex-direction:column; }
        .card-back { transform:rotateY(180deg); }
        .nav-link { color:#64748b; font-size:14px; text-decoration:none; transition:color 0.2s; }
        .nav-link:hover { color:#0d9488; }
        .btn-primary { background:#0f172a; color:#fff; border:none; padding:14px 30px; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .btn-primary:hover { background:#1e293b; transform:translateY(-1px); box-shadow:0 8px 24px rgba(15,23,42,0.25); }
        .btn-secondary { background:transparent; color:#0f172a; border:1.5px solid #cbd5e1; padding:14px 30px; border-radius:10px; font-size:15px; font-weight:500; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-block; transition:all 0.2s; }
        .btn-secondary:hover { border-color:#0d9488; color:#0d9488; }
        .pain-card { transition:all 0.3s ease; }
        .pain-card:hover { box-shadow:0 20px 60px rgba(0,0,0,0.1); transform:translateY(-3px); }
        .stat-card { transition:transform 0.2s ease; }
        .stat-card:hover { transform:translateY(-4px); }
        .feature-visual { transition:transform 0.4s ease; }
        .feature-card:hover .feature-visual { transform:scale(1.015); }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? 'rgba(250,250,249,0.92)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.35s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 56px',
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#0d9488', letterSpacing: '-0.5px' }}>FleetPulse</div>
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <a href="#problem" className="nav-link">The Problem</a>
          <a href="#solution" className="nav-link">Solution</a>
          <a href="#results" className="nav-link">Results</a>
        <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => navigate('/signup')}>Sign up</button>
        <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('/login')}>Sign in</button>        </div>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '130px 56px 80px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(170deg, #fafaf9 0%, #f0fdf9 45%, #fafaf9 100%)',
      }}>
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite 3s' }} />

        <div style={{ textAlign: 'center', maxWidth: 860, position: 'relative', animation: 'slideUp 0.9s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #d1fae5', borderRadius: 100, padding: '7px 18px', marginBottom: 36, boxShadow: '0 2px 12px rgba(13,148,136,0.08)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>Real-time Fleet Intelligence — Built for Transport Managers</span>
          </div>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(44px, 6.5vw, 82px)', lineHeight: 1.05, marginBottom: 28, letterSpacing: '-2.5px', color: '#0f172a' }}>
            Your fleet is running.<br />
            <span style={{ color: '#0d9488', fontStyle: 'italic' }}>Are you in control?</span>
          </h1>

          <p style={{ fontSize: 19, color: '#64748b', lineHeight: 1.75, maxWidth: 600, margin: '0 auto 44px', fontWeight: 300 }}>
            Most transport managers run their fleet on phone calls and spreadsheets. FleetPulse replaces that chaos with live GPS, intelligent alerts, and an AI agent that answers questions about your fleet instantly.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>See the Live Dashboard</button>
            <a href="#problem" className="btn-secondary">See the problem first</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Vehicles Live', value: '10', color: '#10b981' },
            { label: 'Active Alerts', value: '5', color: '#ef4444' },
            { label: 'Avg Speed', value: '47 km/h', color: '#6366f1' },
            { label: 'Avg Fuel', value: '68%', color: '#f59e0b' },
            { label: 'Drivers Online', value: '8', color: '#0d9488' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '16px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE */}
      <div style={{ background: '#0f172a', padding: '16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, r) => (
            <div key={r} style={{ display: 'flex', gap: 56, paddingRight: 56 }}>
              {['Live GPS Tracking', 'Smart Alerts', 'Fuel Analytics', 'Driver Scorecards', 'Geofencing', 'AI Fleet Agent', 'Automated Reports', 'Real-time Dashboard', 'Trip History', 'Driver Leaderboard'].map(t => (
                <span key={t} style={{ color: '#334155', fontSize: 11, fontWeight: 600, letterSpacing: 2.5 }}>— {t.toUpperCase()}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM SECTION */}
      <div id="problem" style={{ padding: '110px 56px', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#ef4444', marginBottom: 18, textTransform: 'uppercase' }}>The Reality</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(34px, 4vw, 56px)', lineHeight: 1.1, color: '#0f172a', maxWidth: 640, letterSpacing: '-1.5px' }}>
              A day in the life of a transport manager{' '}
              <span style={{ color: '#ef4444', fontStyle: 'italic' }}>without</span> FleetPulse
            </h2>
            <p style={{ color: '#64748b', marginTop: 18, fontSize: 17, maxWidth: 500, lineHeight: 1.65, fontWeight: 300 }}>
              Flip each card to see how FleetPulse changes the story. Every one of these is a real pain point reported by fleet managers across India.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 22 }}>
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
              <div key={i} className="feature-card" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, overflow: 'hidden', minHeight: 340,
              }}>
                <div style={{ padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#0d9488', textTransform: 'uppercase', marginBottom: 20 }}>{f.tag}</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 18, letterSpacing: '-0.5px' }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.75, fontWeight: 300, maxWidth: 400 }}>{f.body}</p>
                  <button className="btn-primary" style={{ marginTop: 32, alignSelf: 'flex-start', fontSize: 13, padding: '10px 22px', background: '#0d9488' }} onClick={() => navigate('/dashboard')}>
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
            onClick={() => navigate('/dashboard')}
            style={{ background: '#fff', color: '#0d9488', border: 'none', padding: '18px 44px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Open Live Dashboard
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#0a0f1e', padding: '28px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", color: '#0d9488', fontSize: 20 }}>FleetPulse</div>
        <div style={{ color: '#334155', fontSize: 13 }}>Real-time Fleet Intelligence Platform — PSG Tech</div>
      </div>
    </div>
  )
}
