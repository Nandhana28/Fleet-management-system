import { useState, useRef, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ToolCall { name: string; done: boolean }
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  isStreaming?: boolean
}
interface Chat {
  id: string
  title: string
  session_id: string
  messages: Message[]
  created_at: string
  updated_at: string
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const CHATS_KEY        = 'fleetpulse_chats_v2'
const ACTIVE_CHAT_KEY  = 'fleetpulse_active_chat_v2'
const LOGIN_TOKEN_KEY  = 'fleetpulse_last_login_token'

// ─── Tool labels ──────────────────────────────────────────────────────────────
const TOOL_UI: Record<string, string> = {
  tool_query_vehicle_location: 'Fetching vehicle location…',
  tool_get_trip_history:       'Loading trip history…',
  tool_get_active_alerts:      'Checking active alerts…',
  tool_send_whatsapp_alert:    'Sending WhatsApp alert…',
  tool_generate_fuel_report:   'Generating fuel report…',
  tool_update_vehicle_status:  'Updating vehicle status…',
}
const TOOL_PDF: Record<string, string> = {
  tool_query_vehicle_location: 'Fetched vehicle location',
  tool_get_trip_history:       'Loaded trip history',
  tool_get_active_alerts:      'Checked active alerts',
  tool_send_whatsapp_alert:    'Sent WhatsApp alert',
  tool_generate_fuel_report:   'Generated fuel report',
  tool_update_vehicle_status:  'Updated vehicle status',
}

const SUGGESTIONS = [
  'What are all active alerts right now?',
  'Where is vehicle-1 right now?',
  'Which vehicles have fuel below 30%?',
  'Show trip history for vehicle-3',
  'Generate fuel report for vehicle-5',
  'Update vehicle-4 to maintenance',
]

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm your FleetPulse AI assistant. Ask me anything about your fleet — vehicle locations, active alerts, fuel reports, trip history, or driver performance.",
  timestamp: new Date().toISOString(),
}

// ─── Persistence helpers ──────────────────────────────────────────────────────
function loadChats(): Chat[] {
  try { return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]') } catch { return [] }
}

function saveChats(chats: Chat[]) {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)) } catch {}
}

function getActiveId(): string | null {
  return localStorage.getItem(ACTIVE_CHAT_KEY)
}

function setActiveId(id: string) {
  localStorage.setItem(ACTIVE_CHAT_KEY, id)
}

function makeChat(): Chat {
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    title: 'New conversation',
    session_id: `session_${Date.now()}`,
    messages: [WELCOME],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function titleFromMessages(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user')
  if (!first) return 'New conversation'
  return first.content.length > 38 ? first.content.slice(0, 38) + '…' : first.content
}

// ─── SSE streaming ────────────────────────────────────────────────────────────
async function streamAgent(
  message: string, sessionId: string,
  onTool: (n: string) => void,
  onText: (c: string) => void,
  onDone: () => void,
  onError: (m: string) => void,
) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!res.ok) { onError(`Server error: ${res.status}`); onDone(); return }
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') { onDone(); return }
      try {
        const p = JSON.parse(raw)
        if (p.type === 'tool')  onTool(p.content)
        if (p.type === 'text')  onText(p.content)
        if (p.type === 'error') onError(p.content)
      } catch {}
    }
  }
  onDone()
}

// ─── PDF export ───────────────────────────────────────────────────────────────
async function exportPDF(chat: Chat) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const m = 14
  let y = m
  doc.setFillColor(13, 148, 136)
  doc.rect(0, 0, pw, 18, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(255, 255, 255)
  doc.text(`FleetPulse AI — ${chat.title}`, m, 12)
  doc.setFont('helvetica', 'normal').setFontSize(8)
  doc.text(`Exported: ${new Date().toLocaleString()}`, pw - m, 12, { align: 'right' })
  y = 26
  for (const msg of chat.messages) {
    if (!msg.content) continue
    const isUser = msg.role === 'user'
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const tools = msg.toolCalls?.filter(t => t.done).map(t => TOOL_PDF[t.name] ?? t.name).join(', ')
    doc.setFontSize(9).setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(msg.content, pw - m * 2 - 6)
    const bh = lines.length * 5 + 8
    const needed = 5 + (tools ? 5 : 0) + bh + 6
    if (y + needed > ph - m) { doc.addPage(); y = m }
    doc.setFontSize(8).setFont('helvetica', 'bold')
    doc.setTextColor(isUser ? 13 : 55, isUser ? 148 : 65, isUser ? 136 : 81)
    doc.text(isUser ? 'You' : 'FleetPulse AI', m, y)
    doc.setFont('helvetica', 'normal').setTextColor(160, 160, 160)
    doc.text(time, pw - m, y, { align: 'right' })
    y += 4
    if (tools) { doc.setFontSize(7.5).setTextColor(161, 98, 7); doc.text(`Tools: ${tools}`, m, y); y += 5 }
    doc.setFillColor(isUser ? 13 : 243, isUser ? 148 : 244, isUser ? 136 : 246)
    doc.roundedRect(m, y, pw - m * 2, bh, 3, 3, 'F')
    doc.setFontSize(9).setFont('helvetica', 'normal')
    doc.setTextColor(isUser ? 255 : 31, isUser ? 255 : 41, isUser ? 255 : 55)
    doc.text(lines, m + 3, y + 5.5)
    y += bh + 6
  }
  doc.save(`fleetpulse-${chat.title.slice(0, 20).replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── ToolBadge ────────────────────────────────────────────────────────────────
function ToolBadge({ name, done }: { name: string; done: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border mb-1 ${
      done ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
    }`}>
      {TOOL_UI[name] ?? `🔧 ${name}`}
      {!done && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
      {done  && <span className="text-teal-500">✓</span>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Agent() {
  const [chats,    setChats]    = useState<Chat[]>(loadChats)
  const [modelInfo, setModelInfo] = useState('Groq · Fleet-aware')
  const [activeId, setActiveId_] = useState<string | null>(() => {
    // Detect new login: if token changed since last run, start fresh
    const currentToken = localStorage.getItem('token') || ''
    const lastToken    = localStorage.getItem(LOGIN_TOKEN_KEY) || ''
    if (currentToken !== lastToken) {
      // New login — always create a fresh chat
      localStorage.setItem(LOGIN_TOKEN_KEY, currentToken)
      return null  // will be resolved below in the effect
    }
    return getActiveId()
  })
  const [input,      setInput]      = useState('')
  const [streaming,  setStreaming]  = useState(false)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const streamingRef = useRef(false)

  // Bootstrap: ensure there's always an active chat
  useEffect(() => {
    if (!activeId || !chats.find(c => c.id === activeId)) {
      const fresh = makeChat()
      const updated = [fresh, ...chats]
      setChats(updated)
      saveChats(updated)
      setActiveId_(fresh.id)
      setActiveId(fresh.id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeChat = chats.find(c => c.id === activeId) ?? chats[0]

  // Fetch model info on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/agent/info`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.model_label) setModelInfo(d.model_label) })
      .catch(() => {})
  }, [])

  // Persist chats whenever they change (debounced to avoid hammering localStorage)
  useEffect(() => { saveChats(chats) }, [chats])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages?.length])

  // ── Mutate active chat ─────────────────────────────────────────────────────
  const patchChat = useCallback((id: string, updater: (c: Chat) => Chat) => {
    setChats(prev => prev.map(c => c.id === id ? updater(c) : c))
  }, [])

  // ── Switch chat ────────────────────────────────────────────────────────────
  const switchChat = (id: string) => {
    setActiveId_(id)
    setActiveId(id)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── New chat ───────────────────────────────────────────────────────────────
  const newChat = () => {
    const fresh = makeChat()
    setChats(prev => {
      const updated = [fresh, ...prev]
      saveChats(updated)
      return updated
    })
    setActiveId_(fresh.id)
    setActiveId(fresh.id)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Delete chat ────────────────────────────────────────────────────────────
  const confirmDelete = (id: string) => setDeleteId(id)
  const doDelete = () => {
    if (!deleteId) return
    setChats(prev => {
      const updated = prev.filter(c => c.id !== deleteId)
      saveChats(updated)
      if (activeId === deleteId) {
        const next = updated[0] ?? makeChat()
        if (!updated[0]) updated.unshift(next)
        setActiveId_(next.id)
        setActiveId(next.id)
      }
      return updated
    })
    setDeleteId(null)
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || streamingRef.current || !activeChat) return
    const chatId = activeChat.id
    const sessionId = activeChat.session_id
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    const asstMsg: Message = { role: 'assistant', content: '', timestamp: new Date().toISOString(), toolCalls: [], isStreaming: true }

    patchChat(chatId, c => ({
      ...c,
      messages: [...c.messages, userMsg, asstMsg],
      title: c.messages.filter(m => m.role === 'user').length === 0 ? titleFromMessages([...c.messages, userMsg]) : c.title,
      updated_at: new Date().toISOString(),
    }))
    setInput('')
    setStreaming(true)
    streamingRef.current = true

    try {
      await streamAgent(
        userMsg.content, sessionId,
        (toolName) => patchChat(chatId, c => {
          const msgs = [...c.messages]
          const last = msgs[msgs.length - 1]
          if (last.role === 'assistant') last.toolCalls = [...(last.toolCalls ?? []), { name: toolName, done: false }]
          return { ...c, messages: msgs }
        }),
        (chunk) => patchChat(chatId, c => {
          const msgs = [...c.messages]
          const last = msgs[msgs.length - 1]
          if (last.role === 'assistant') {
            last.toolCalls = last.toolCalls?.map(t => ({ ...t, done: true }))
            last.content = chunk
          }
          return { ...c, messages: msgs }
        }),
        () => {
          patchChat(chatId, c => {
            const msgs = [...c.messages]
            const last = msgs[msgs.length - 1]
            if (last.role === 'assistant') {
              last.isStreaming = false
              last.toolCalls = last.toolCalls?.map(t => ({ ...t, done: true }))
              if (!last.content) last.content = 'Done. Anything else?'
            }
            return { ...c, messages: msgs, title: titleFromMessages(msgs), updated_at: new Date().toISOString() }
          })
          setStreaming(false); streamingRef.current = false; inputRef.current?.focus()
        },
        (errMsg) => {
          patchChat(chatId, c => {
            const msgs = [...c.messages]
            const last = msgs[msgs.length - 1]
            if (last.role === 'assistant') { last.content = `Error: ${errMsg}`; last.isStreaming = false }
            return { ...c, messages: msgs }
          })
          setStreaming(false); streamingRef.current = false
        },
      )
    } catch {
      patchChat(chatId, c => {
        const msgs = [...c.messages]
        const last = msgs[msgs.length - 1]
        if (last.role === 'assistant') { last.content = 'Connection error. Make sure the backend is running.'; last.isStreaming = false }
        return { ...c, messages: msgs }
      })
      setStreaming(false); streamingRef.current = false
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const messages = activeChat?.messages ?? []

  return (
    <div className="h-full flex bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            New chat
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto py-2">
          {chats.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 px-4">No conversations yet</p>
          )}
          {chats.map(chat => {
            const isActive = chat.id === activeId
            return (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`group relative mx-2 mb-0.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                  isActive ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium truncate pr-6 ${isActive ? 'text-teal-800' : 'text-gray-700'}`}>
                  {chat.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(chat.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  <span className="ml-1 text-gray-300">· {chat.messages.filter(m => m.role === 'user').length} msg</span>
                </p>
                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); confirmDelete(chat.id) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-100 hover:text-red-500 text-gray-400 transition-all"
                  title="Delete conversation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">{chats.length} conversation{chats.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="px-6 py-3.5 border-b border-gray-200 bg-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-base">🤖</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 truncate">{activeChat?.title ?? 'FleetPulse AI'}</h2>
            <p className="text-xs text-gray-400">Powered by {modelInfo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeChat && exportPDF(activeChat)}
              disabled={!activeChat || messages.length <= 1}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ⬇ PDF
            </button>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${streaming ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-amber-400 animate-ping' : 'bg-green-400'}`} />
              {streaming ? 'Thinking…' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl ${msg.role === 'user' ? '' : 'w-full'}`}>
                {msg.role === 'assistant' && msg.isStreaming && msg.toolCalls && msg.toolCalls.some(t => !t.done) && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 mb-2 opacity-60">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Thinking...
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'
                }`}>
                  {msg.isStreaming && !msg.content
                    ? <span className="flex gap-1 py-1">{[0, 150, 300].map(d => <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
                    : <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                        {msg.isStreaming && <span className="inline-block w-0.5 h-4 bg-teal-500 ml-0.5 animate-pulse align-middle" />}
                      </p>
                  }
                  <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions — only on fresh chat */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-2 items-center">
          <input
            ref={inputRef} type="text" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about your fleet…" disabled={streaming}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
          />
          <button onClick={sendMessage} disabled={streaming || !input.trim()}
            className="bg-teal-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors font-semibold">
            {streaming ? '…' : 'Send'}
          </button>
        </div>
      </div>

      {/* ── Delete confirmation dialog ───────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete conversation?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "{chats.find(c => c.id === deleteId)?.title}" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={doDelete}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
