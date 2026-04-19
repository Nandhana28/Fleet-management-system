import { useQuery } from '@tanstack/react-query'
import { getActivity } from '../../services/profileApi'
import { Card } from '../ui/Card'

interface Activity {
  user_id: string
  action: string
  timestamp: string
  ip_address?: string
}

export function ActivityTimeline() {
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => getActivity(50),
  })

  const activities: Activity[] = activityData?.activities || []

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return '🔓'
    if (action.includes('logout')) return '🔒'
    if (action.includes('trip')) return '🚗'
    if (action.includes('alert')) return '🚨'
    if (action.includes('profile')) return '👤'
    return '📌'
  }

  if (isLoading) return <Card className="p-6">Loading activity...</Card>

  return (
    <Card className="p-6">
      <div>
        <h3 className="text-lg font-semibold dark:text-white mb-4">Activity History</h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                <div className="text-2xl">{getActionIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-white text-sm capitalize">
                    {activity.action}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                  {activity.ip_address && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      IP: {activity.ip_address}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No activity recorded yet
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <button className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            Download Activity Report
          </button>
        )}
      </div>
    </Card>
  )
}
