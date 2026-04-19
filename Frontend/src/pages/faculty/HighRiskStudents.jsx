import { useState } from 'react'
import { Send, AlertTriangle } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

export default function HighRiskStudents() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [message, setMessage] = useState('')
  const qc = useQueryClient()

  const { data: students, isLoading } = useQuery({
    queryKey: ['high-risk-students'],
    queryFn: () => api.get('/faculty/high-risk-students').then(r => r.data),
  })

  const sendMessage = useMutation({
    mutationFn: (data) => api.post('/faculty/send-message', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Message sent successfully')
      setMessage('')
      setSelectedStudent(null)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to send message'),
  })

  const handleSend = () => {
    if (!selectedStudent || !message.trim()) return
    sendMessage.mutate({ studentId: selectedStudent._id, message: message.trim() })
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">High Risk Students</h1>
        <p className="text-sm text-muted-foreground">Send messages to help students improve performance</p>
      </div>

      {!students?.length ? (
        <div className="bg-background rounded-xl border border-border p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-foreground/70 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No high risk students found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Students List */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Students ({students.length})</p>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {students.map(s => (
                <button
                  key={s._id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full px-5 py-3 text-left hover:bg-muted transition-colors ${
                    selectedStudent?._id === s._id ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.rollNumber} · Sem {s.semester}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.riskLevel === 'high' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {s.riskLevel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Box */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-sm font-semibold text-foreground">
                {selectedStudent ? `Message to ${selectedStudent.name}` : 'Select a student'}
              </p>
            </div>
            <div className="p-5 space-y-4">
              {selectedStudent ? (
                <>
                  <div className="bg-muted rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Student Details</p>
                    <p className="text-sm font-medium text-foreground">{selectedStudent.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStudent.department} · Semester {selectedStudent.semester}
                    </p>
                    <p className="text-xs">
                      Risk Score: <span className="font-semibold">{selectedStudent.riskScore}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a supportive message to help the student improve..."
                      className="w-full h-40 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    className="w-full h-9 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendMessage.isPending ? 'Sending...' : 'Send Message'}
                  </button>
                </>
              ) : (
                <div className="text-center py-20 text-sm text-muted-foreground">
                  Select a student to send a message
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
