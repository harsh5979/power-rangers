import { useState } from 'react'
import { RiskBadge } from '@/components/shared'
import { PageLoader } from '@/components/ui/loader'
import Pagination from '@/components/ui/Pagination'
import { Bell, CheckCheck } from 'lucide-react'
import { useAlerts, useMarkAlertRead } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export default function FacultyAlerts() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: alerts = [], isLoading } = useAlerts()
  const markReadMutation = useMarkAlertRead()

  const markAllRead = async () => {
    await Promise.all(alerts.filter(a => !a.isRead).map(a => api.patch(`/alerts/${a._id}/read`)))
    qc.invalidateQueries({ queryKey: ['alerts'] })
    toast.success('All marked as read')
  }

  const unread    = alerts.filter(a => !a.isRead).length
  const paginated = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? <PageLoader /> : alerts.length === 0 ? (
        <div className="bg-background rounded-xl border border-border py-16 text-center">
          <Bell className="h-8 w-8 mx-auto mb-2 text-foreground/70" />
          <p className="text-sm text-muted-foreground">No alerts</p>
        </div>
      ) : (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">All Alerts</p>
            <span className="text-xs text-muted-foreground">{alerts.length} total</span>
          </div>
          <div className="divide-y divide-border">
            {paginated.map(a => (
              <div key={a._id} className={`flex items-start justify-between gap-3 px-5 py-4 hover:bg-muted transition-colors ${a.isRead ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.isRead ? 'bg-muted' : 'bg-violet-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{a.student?.name}</p>
                      <span className="text-xs text-muted-foreground">{a.student?.rollNumber}</span>
                      <RiskBadge level={a.riskLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {!a.isRead && (
                  <button onClick={() => markReadMutation.mutate(a._id)}
                    className="shrink-0 text-xs text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap">
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} total={alerts.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
