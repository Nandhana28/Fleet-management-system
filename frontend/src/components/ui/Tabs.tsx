import { useState } from 'react'

interface Tab {
  label: string
  id: string
  content: React.ReactNode
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (id: string) => void
  className?: string
}

export function Tabs({ tabs, defaultTab, activeTab: controlledTab, onTabChange, className = '' }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id)
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = (id: string) => {
    setInternalTab(id)
    onTabChange?.(id)
  }

  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
