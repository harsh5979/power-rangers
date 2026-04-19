import { useState } from 'react'
import { RiskBadge } from '@/components/shared'
import { TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import { useRecalcRisk } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'

const RISK_BAR = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-green-500' }
const FACTOR_ICON = f => {
  const t = f.toLowerCase()
  if (t.includes('attendance')) return '📅'
  if (t.includes('marks') || t.includes('predicted')) return '📊'
  if (t.includes('assignment')) return '📝'
  return '⚠️'
}

function BehaviorTag({ label, type }) {
  const styles = { danger: 'bg-red-50 text-red-700 border-red-200', warning: 'bg-amber-50 text-amber-700 border-amber-200', good: 'bg-green-50 text-green-700 border-green-200' }
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[type]}`}>{label}</span>
}

function StudentRow({ s }) {
  const [expanded, setExpanded] = useState(false)
  const recalcMutation = useRecalcRisk()

  const tags = []
  s.riskFactors?.forEach(f => {
    const t = f.factor.toLowerCase()
    if (t.includes('attendance'))  tags.push({ label: 'Low Attendance',       type: 'danger' })
    if (t.includes('marks below')) tags.push({ label: 'Failing Marks',        type: 'danger' })
    if (t.includes('predicted'))   tags.push({ label: 'Declining Trend',      type: 'warning' })
    if (t.includes('assignment'))  tags.push({ label: 'Missing Assignments',  type: 'warning' })
  })
  if (!tags.length && s.riskLevel === 'low') tags.push({ label: 'On Track', type: 'good' })

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted cursor-pointer transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-primary-foreground ${s.riskLevel === 'high' ? 'bg-red-500' : s.riskLevel === 'medium' ? 'bg-amber-400' : 'bg-green-500'}`}>
          {s.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.rollNumber} · Sem {s.semester}</p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-xs">
          {tags.slice(0, 2).map((t, i) => <BehaviorTag key={i} {...t} />)}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 w-24 shrink-0">
          <div className="flex items-center gap-1.5 w-full">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${RISK_BAR[s.riskLevel]}`} style={{ width: `${s.riskScore}%` }} />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-6 text-right">{s.riskScore}</span>
          </div>
          <RiskBadge level={s.riskLevel} />
        </div>
        <div className="sm:hidden shrink-0"><RiskBadge level={s.riskLevel} /></div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); recalcMutation.mutate(s._id) }}
            disabled={recalcMutation.isPending}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-violet-600 hover:bg-violet-50 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 bg-muted border-t border-border">
          <div className="pt-3 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Behavior Indicators</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.length ? tags.map((t, i) => <BehaviorTag key={i} {...t} />) : <span className="text-xs text-muted-foreground">No issues</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Risk Factors</p>
              {s.riskFactors?.length ? (
                <div className="space-y-1.5">
                  {s.riskFactors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span>{FACTOR_ICON(f.factor)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/80">{f.factor}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(f.weight * 2, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">wt:{f.weight}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No risk factors</p>}
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${RISK_BAR[s.riskLevel]}`} style={{ width: `${s.riskScore}%` }} />
                </div>
                <span className="text-sm font-bold text-foreground">{s.riskScore}<span className="text-muted-foreground font-normal text-xs">/100</span></span>
                {s.riskLevel === 'high'   && <TrendingDown className="h-4 w-4 text-red-500" />}
                {s.riskLevel === 'medium' && <Minus className="h-4 w-4 text-amber-500" />}
                {s.riskLevel === 'low'    && <TrendingUp className="h-4 w-4 text-green-500" />}
              </div>
              {s.lastRiskCalculated && <p className="text-xs text-muted-foreground mt-1">Last calculated: {new Date(s.lastRiskCalculated).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Props: students (current page data), total, page, onPageChange, loading, title
// Filter tabs are client-side on current page only (server handles search/filter)
export default function StudentRiskPanel({ students = [], total = 0, page, onPageChange, loading, title = 'Students', header }) {
  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-foreground">{title} <span className="text-muted-foreground font-normal">({total})</span></p>
        {header}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" /></div>
      ) : students.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No students found</div>
      ) : (
        <div className="divide-y divide-border">
          {students.map(s => <StudentRow key={s._id} s={s} />)}
        </div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={onPageChange} />
    </div>
  )
}
