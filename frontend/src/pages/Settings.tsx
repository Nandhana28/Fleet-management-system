export default function Settings() {
  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Settings</h2>

      <div className="space-y-4 max-w-xl">
        {/* Alert Thresholds */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Alert Thresholds</h3>
          <div className="space-y-3">
            {[
              { label: 'Fuel Low (%)', defaultValue: '20' },
              { label: 'Speed Limit (km/h)', defaultValue: '80' },
              { label: 'Idle Timeout (mins)', defaultValue: '15' },
            ].map(field => (
              <div key={field.label} className="flex items-center justify-between">
                <label className="text-sm text-gray-600">{field.label}</label>
                <input
                  type="number"
                  defaultValue={field.defaultValue}
                  className="border border-gray-200 rounded px-3 py-1 text-sm w-24 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Notifications</h3>
          <div className="space-y-3">
            {[
              { label: 'WhatsApp Number', placeholder: '+91 XXXXX XXXXX' },
              { label: 'Email', placeholder: 'fleet@example.com' },
            ].map(field => (
              <div key={field.label} className="flex items-center justify-between gap-4">
                <label className="text-sm text-gray-600 whitespace-nowrap">{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="border border-gray-200 rounded px-3 py-1 text-sm flex-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">Settings configuration coming in Week 4.</p>
      </div>
    </div>
  )
}