import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, total, pageSize = 10, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-muted-foreground">{from}–{to}</span> of <span className="font-medium text-muted-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="text-xs text-muted-foreground px-1">…</span>
            ) : (
              <button key={p} onClick={() => onChange(p)}
                className={`h-7 w-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-violet-600 text-primary-foreground border border-violet-600'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                }`}>
                {p}
              </button>
            )
          )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
