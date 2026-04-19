import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, FileText, FileBarChart2 } from 'lucide-react'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PrincipalReports() {
  const [riskLevel, setRiskLevel] = useState('')
  const [department, setDepartment] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadAtRisk = async (format) => {
    try {
      const params = { format }
      if (riskLevel) params.riskLevel = riskLevel
      if (department) params.department = department

      if (format === 'csv') {
        const res = await api.get('/reports/at-risk', { params, responseType: 'blob' })
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url; a.download = 'at-risk-report.csv'; a.click()
        URL.revokeObjectURL(url)
      } else {
        const res = await api.get('/reports/at-risk', { params })
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'at-risk-report.json'; a.click()
        URL.revokeObjectURL(url)
      }
      toast.success('Report downloaded!')
    } catch { toast.error('Download failed') }
  }

  const downloadComprehensivePDF = async () => {
    try {
      setIsGenerating(true)
      const res = await api.get('/reports/comprehensive')
      const data = res.data.reportData
      const collegeName = res.data.college || 'College'

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text(`Comprehensive Academic Report`, 14, 22)
      doc.setFontSize(12)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text(collegeName, 14, 30)
      
      let startY = 40
      
      for (const dept in data) {
        for (const sem in data[dept]) {
          const semData = data[dept][sem]
          
          if (startY > 250) {
            doc.addPage()
            startY = 20
          }
          
          // Section Header
          doc.setFontSize(13)
          doc.setTextColor(71, 85, 105) // Slate-600
          doc.setFont(undefined, 'bold')
          doc.text(`Department: ${dept}  |  Semester: ${sem}`, 14, startY)
          startY += 6
          
          // Stats Row
          doc.setFontSize(10)
          doc.setTextColor(100, 116, 139)
          doc.setFont(undefined, 'normal')
          doc.text(`Total Students: ${semData.stats.total}   |   Avg Risk Score: ${semData.stats.avgRisk}%   |   High Risk: ${semData.stats.high}`, 14, startY)
          startY += 6
          
          const tableData = semData.students.map(s => [
            s.name, 
            s.rollNumber, 
            s.riskLevel ? s.riskLevel.charAt(0).toUpperCase() + s.riskLevel.slice(1) : 'Unknown', 
            s.riskScore ? `${s.riskScore}%` : 'N/A'
          ])
          
          const result = autoTable(doc, {
            startY: startY,
            head: [['Student Name', 'Roll No.', 'Risk Level', 'Risk Score']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [109, 40, 217] }, // Violet-700
            alternateRowStyles: { fillColor: [248, 250, 252] },
          })
          
          startY = (result?.finalY ?? doc.lastAutoTable?.finalY ?? startY + 30) + 15
        }
      }

      doc.save('comprehensive_academic_report.pdf')
      toast.success('PDF Generated!')
    } catch (err) {
      toast.error('Failed to generate PDF')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* At-Risk Report Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-600" /> At-Risk Student Report
            </CardTitle>
            <CardDescription>Export flat reports mapping specific risk factors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Filter by Risk Level</Label>
                <Select onValueChange={v => setRiskLevel(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="All levels" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filter by Department</Label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadAtRisk('csv')} className="gap-2 bg-violet-600 hover:bg-violet-700">
                <Download className="h-4 w-4" /> Download CSV
              </Button>
              <Button variant="outline" onClick={() => downloadAtRisk('json')} className="gap-2">
                <Download className="h-4 w-4" /> Download JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Report Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart2 className="h-4 w-4 text-blue-600" /> Comprehensive PDF Report
            </CardTitle>
            <CardDescription>Hierarchical report mapping all departments, semesters, and overall stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground mb-6 border border-blue-50 bg-blue-50/50 p-4 rounded-lg">
              Generate a full-college structural PDF. This report automatically groups all students by their respective <b>Departments</b> and <b>Semesters</b>, calculating average academic risks and summarising statistics globally.
            </div>
            <Button onClick={downloadComprehensivePDF} disabled={isGenerating} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-primary-foreground">
              <Download className="h-4 w-4" /> 
              {isGenerating ? 'Generating Architecture...' : 'Download Full PDF'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
