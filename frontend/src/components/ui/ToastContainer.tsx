import { useToastStore } from '../../store/toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  // Only SOS/critical toasts show — regular ones go to log
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            background: toast.type === 'success' ? '#f0fdf9' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? '#99f6e4' : '#fecaca'}`,
            borderLeft: `4px solid ${toast.type === 'success' ? '#0d9488' : '#ef4444'}`,
            borderRadius: 12,
            padding: '12px 16px',
            minWidth: 280,
            maxWidth: 360,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'all',
            cursor: 'pointer',
            animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: toast.type === 'success' ? '#0d9488' : '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {toast.type === 'success'
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: toast.type === 'success' ? '#0f766e' : '#dc2626', fontWeight: 600, margin: 0 }}>
              {toast.message}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Click to dismiss</p>
          </div>
        </div>
      ))}
    </div>
  )
}