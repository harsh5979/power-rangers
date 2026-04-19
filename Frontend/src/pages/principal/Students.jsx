import { useState } from 'react'
import { RiskBadge, SearchInput, SectionCard, DataTable } from '@/components/shared'
import Pagination from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudents } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'

const COLUMNS = [
  { key: 'name',   label: 'Student',    render: s => <div><p className="font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.rollNumber}</p></div> },
  { key: 'dept',   label: 'Dept / Sem', render: s => <span className="text-xs text-muted-foreground">{s.department} · Sem {s.semester}</span> },
  { key: 'risk',   label: 'Risk',       render: s => <RiskBadge level={s.riskLevel} /> },
  { key: 'score',  label: 'Score',      render: s => <span className="font-mono text-foreground/80">{s.riskScore}</span> },
  { key: 'mentor', label: 'Mentor',     render: s => <span className="text-xs text-muted-foreground">{s.facultyMentor?.name || '—'}</span> },
  { key: 'factor', label: 'Top Factor', render: s => <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{s.riskFactors?.[0]?.factor || '—'}</span> },
]

export default function PrincipalStudents() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [riskLevel, setRisk]  = useState('')

  const { data, isLoading } = useStudents({ page, limit: PAGE_SIZE, search, riskLevel })

  const handleSearch = v => { setSearch(v); setPage(1) }
  const handleRisk   = v => { setRisk(v === 'all' ? '' : v); setPage(1) }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold text-foreground">All Students</h1>
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search name or roll no..." className="w-56" />
        <Select onValueChange={handleRisk}>
          <SelectTrigger className="w-36 h-9 text-sm border-border"><SelectValue placeholder="Risk Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SectionCard title="Students" subtitle={`${data?.total ?? 0} total`}>
        <DataTable columns={COLUMNS} rows={data?.data || []} loading={isLoading} emptyMessage="No students found" />
        <Pagination page={page} total={data?.total || 0} pageSize={PAGE_SIZE} onChange={setPage} />
      </SectionCard>
    </div>
  )
}
