import { Search, CheckCircle2, InboxIcon } from 'lucide-react'

// ── RiskBadge ─────────────────────────────────────────────────
export function RiskBadge({ level }) {
  const map = {
    high:   'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low:    'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[level] || 'bg-muted text-muted-foreground border-border'}`}>
      {level?.toUpperCase() || '—'}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ title, value, sub, icon: Icon, color = 'text-violet-600' }) {
  return (
    <div className="bg-background rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
      </div>
      <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── SectionCard ───────────────────────────────────────────────
// White panel with header + optional right element
export function SectionCard({ title, subtitle, right, children, className = '' }) {
  return (
    <div className={`bg-background rounded-xl border border-border overflow-hidden ${className}`}>
      {(title || right) && (
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── SearchInput ───────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        className="h-9 w-full pl-9 pr-3 text-sm border border-border rounded-lg outline-none focus:border-violet-400 bg-background"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ message = 'No data found', icon: Icon = InboxIcon }) {
  return (
    <div className="py-14 flex flex-col items-center gap-2 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── TabBar ────────────────────────────────────────────────────
// tabs: [{ key, label }]
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex rounded-lg border border-border bg-background overflow-hidden text-sm w-fit">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            active === t.key ? 'bg-violet-600 text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── DataTable ─────────────────────────────────────────────────
// columns: [{ key, label, render?: (row) => ReactNode, className? }]
export function DataTable({ columns, rows, keyField = '_id', loading, emptyMessage }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted border-b border-border">
            {columns.map(c => (
              <th key={c.key} className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${c.className || ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                {emptyMessage || 'No data found'}
              </td>
            </tr>
          ) : rows.map(row => (
            <tr key={row[keyField]} className="hover:bg-muted transition-colors">
              {columns.map(c => (
                <td key={c.key} className={`px-4 py-2.5 ${c.className || ''}`}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── ActionButton ──────────────────────────────────────────────
export function ActionButton({ onClick, variant = 'primary', size = 'sm', disabled, loading, children, className = '' }) {
  const variants = {
    primary:   'bg-violet-600 hover:bg-violet-700 text-primary-foreground',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    secondary: 'bg-background hover:bg-muted text-foreground/80 border border-border',
    ghost:     'text-muted-foreground hover:text-foreground/80 hover:bg-muted',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', icon: 'h-7 w-7' }
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  )
}
