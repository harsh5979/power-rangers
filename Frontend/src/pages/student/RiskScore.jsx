import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { RiskBadge } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'

export default function StudentRisk() {
  const [profile, setProfile] = useState(null)
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/my-profile').then(async r => {
      setProfile(r.data)
      const iv = await api.get(`/interventions/${r.data._id}`)
      setInterventions(iv.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Risk Score</h1>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Current Risk Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{profile.riskScore}<span className="text-xl text-muted-foreground">/100</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {profile.lastRiskCalculated ? new Date(profile.lastRiskCalculated).toLocaleDateString() : 'Not yet calculated'}
              </p>
            </div>
            <RiskBadge level={profile.riskLevel} />
          </div>
          <Progress
            value={profile.riskScore}
            className={`h-3 ${profile.riskLevel === 'high' ? '[&>div]:bg-destructive' : profile.riskLevel === 'medium' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
          />
        </CardContent>
      </Card>

      {/* Factor breakdown */}
      {profile.riskFactors?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Risk Factor Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {profile.riskFactors.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{f.factor}</span>
                  <span className="text-muted-foreground">Impact: {f.weight}%</span>
                </div>
                <Progress value={f.weight} className="h-2 [&>div]:bg-destructive" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Intervention history */}
      {interventions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Intervention History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {interventions.map(iv => (
              <div key={iv._id} className="p-3 rounded-md bg-secondary/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{iv.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">{new Date(iv.date).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">{iv.remarks}</p>
                {iv.preRiskScore != null && iv.postRiskScore != null && (
                  <p className="text-xs">
                    Risk: <span className="font-mono">{iv.preRiskScore}</span>
                    {' → '}
                    <span className={`font-mono ${iv.postRiskScore < iv.preRiskScore ? 'text-green-500' : 'text-destructive'}`}>
                      {iv.postRiskScore}
                    </span>
                    {iv.postRiskScore < iv.preRiskScore ? ' ✓ Improved' : ' ↑ Needs attention'}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
