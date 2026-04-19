// Reusable inline page loader
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
    </div>
  )
}

// Reusable empty state
export function EmptyState({ message = 'No data found' }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>
  )
}
