import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { StatCard, RiskBadge } from '@/components/shared'
import { Users, BookOpen, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CoordinatorDashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data?.data || r.data || [])).finally(() => setLoading(false))
  }, [])

  const atRisk = students.filter(s => s.riskLevel !== 'low')

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coordinator Dashboard</h1>
        <p className="text-muted-foreground text-sm">Subject-wise academic performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} />
        <StatCard title="At Risk" value={atRisk.length} icon={AlertTriangle} color="text-destructive" />
        <StatCard title="Subjects" value="—" icon={BookOpen} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Students Needing Attention</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {atRisk.slice(0, 8).map(s => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-md bg-secondary/40">
                <div>
                  <p className="text-sm font-medium">{s.name} <span className="text-muted-foreground">({s.rollNumber})</span></p>
                  <p className="text-xs text-muted-foreground">{s.riskFactors?.slice(0, 2).map(f => f.factor).join(' · ')}</p>
                </div>
                <RiskBadge level={s.riskLevel} />
              </div>
            ))}
            {atRisk.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">All students performing well 🎉</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
