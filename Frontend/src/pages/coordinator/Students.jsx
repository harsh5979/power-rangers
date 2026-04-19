import { useState } from 'react'
import StudentRiskPanel from '@/components/StudentRiskPanel'
import { SearchInput } from '@/components/shared'
import { useStudents } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'
import useAuthStore from '@/store/authStore'

export default function CoordinatorStudents() {
  const { user }            = useAuthStore()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useStudents({ page, limit: PAGE_SIZE, search })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Students</h1>
        {user?.subjects?.length > 0 && <p className="text-sm text-muted-foreground mt-0.5">Subject: <span className="font-medium text-foreground/80">{user.subjects.join(', ')}</span></p>}
      </div>
      <StudentRiskPanel
        students={data?.data || []}
        total={data?.total || 0}
        page={page}
        onPageChange={setPage}
        loading={isLoading}
        title="Student Risk Overview"
        header={<SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} className="w-48" />}
      />
    </div>
  )
}
