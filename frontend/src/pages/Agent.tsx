export default function Agent() {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-800">AI Agent</h2>
        <p className="text-sm text-gray-400 mt-1">Ask anything about your fleet.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 shadow-sm max-w-md">
            Hi! I'm your fleet assistant. I can help you with vehicle status, alerts, fuel trends, and driver performance. What would you like to know?
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-white flex gap-3">
        <input
          type="text"
          placeholder="Ask about your fleet..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled
        />
        <button
          className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
          disabled
        >
          Send
        </button>
      </div>
    </div>
  )
}