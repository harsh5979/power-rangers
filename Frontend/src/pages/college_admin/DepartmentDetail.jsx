import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, BookOpen, Users, Plus, Trash2, UserPlus, ArrowUpRight,
  ChevronDown, ChevronRight, GraduationCap, User, Shield, RefreshCw,
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import useAuthStore from '@/store/authStore'
import {
  useDepartmentOverview, useCreateSubject, useDeleteSubject,
  useAssignFaculty, useAssignMentor, usePromoteStudents, useFacultyList,
} from '@/hooks/useApi'

// Generate batch years: current year down to 2018
const BATCH_YEARS = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return `${y}-${String(y + 1).slice(2)}`
})

export default function DepartmentDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [expandedSem, setExpandedSem]             = useState(null)
  const [subjectName, setSubjectName]             = useState('')
  const [subjectSem, setSubjectSem]               = useState('')
  const [assignSubjectId, setAssignSubjectId]     = useState(null)
  const [assignFacultyId, setAssignFacultyId]     = useState('')
  // Top-level mentor assignment (new)
  const [mentorBatchYear, setMentorBatchYear]     = useState('')
  const [topMentorId, setTopMentorId]             = useState('')
  // Change mentor for existing batch
  const [changingBatch, setChangingBatch]         = useState(null) // batchYear string
  const [changeMentorId, setChangeMentorId]       = useState('')

  const { data, isLoading }   = useDepartmentOverview(id)
  const { data: facultyList } = useFacultyList()
  const createSubject  = useCreateSubject()
  const deleteSubject  = useDeleteSubject()
  const assignFaculty  = useAssignFaculty()
  const assignMentor   = useAssignMentor()
  const promote        = usePromoteStudents()

  if (isLoading) return <PageLoader />

  const dept      = data?.department
  const semesters = data?.semesters || []
  const teachers  = (facultyList || []).filter(f => f.role === 'faculty' || f.role === 'subject_coordinator' || f.role === 'mentor')
  const allFaculty = facultyList || []

  // Collect all batches across semesters (deduplicated)
  const allBatches = []
  semesters.forEach(sem => {
    sem.batches.forEach(b => {
      const existing = allBatches.find(x => x.batchYear === b.batchYear)
      if (existing) {
        existing.studentCount += b.studentCount
      } else {
        allBatches.push({ batchYear: b.batchYear, studentCount: b.studentCount, mentor: b.mentor })
      }
    })
  })

  // IDs of mentors already assigned to a batch (can't assign them to another)
  const assignedMentorIds = new Set(
    allBatches.filter(b => b.mentor?._id).map(b => b.mentor._id)
  )

  // Batch years that already have a mentor (can't use "Assign", must use "Change")
  const batchesWithMentor = new Set(
    allBatches.filter(b => b.mentor).map(b => b.batchYear)
  )

  // Available faculty for NEW assignment (exclude already-assigned mentors)
  const availableFacultyForAssign = allFaculty.filter(f => !assignedMentorIds.has(f._id))

  // Available faculty for CHANGE (exclude assigned mentors except the current one being changed)
  const getAvailableFacultyForChange = (currentMentorId) =>
    allFaculty.filter(f => !assignedMentorIds.has(f._id) || f._id === currentMentorId)

  // Batch years available for new assignment (only those without a mentor)
  const availableBatchYears = BATCH_YEARS.filter(y => !batchesWithMentor.has(y))

  const toggleSem = (sem) => setExpandedSem(prev => prev === sem ? null : sem)

  const addSubject = async (e) => {
    e.preventDefault()
    if (!subjectName || !subjectSem) return
    await createSubject.mutateAsync({ deptId: id, name: subjectName, semester: Number(subjectSem) })
    setSubjectName('')
    setSubjectSem('')
  }

  const handleAssignFaculty = async () => {
    if (!assignSubjectId || !assignFacultyId) return
    await assignFaculty.mutateAsync({ subjectId: assignSubjectId, facultyId: assignFacultyId })
    setAssignSubjectId(null)
    setAssignFacultyId('')
  }

  // Top-level: NEW mentor assignment (change=false)
  const handleAssignNewMentor = async () => {
    if (!mentorBatchYear || !topMentorId) return
    await assignMentor.mutateAsync({ deptId: id, mentorId: topMentorId, batchYear: mentorBatchYear, change: false })
    setMentorBatchYear('')
    setTopMentorId('')
  }

  // Change mentor for existing batch (change=true)
  const handleChangeMentor = async () => {
    if (!changingBatch || !changeMentorId) return
    await assignMentor.mutateAsync({ deptId: id, mentorId: changeMentorId, batchYear: changingBatch, change: true })
    setChangingBatch(null)
    setChangeMentorId('')
  }

  const handlePromote = (fromSem) => {
    if (confirm(`Promote all students from Semester ${fromSem} to Semester ${fromSem + 1}?`)) {
      promote.mutate({ deptId: id, fromSemester: fromSem })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/${user?.role === 'college_admin' ? 'college-admin' : 'principal'}/departments`}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{dept?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dept?.durationYears} Years · {dept?.totalSemesters} Semesters · {user?.college}
          </p>
        </div>
      </div>

      {/* ═══ MENTOR MANAGEMENT CARD ═══ */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">Batch Mentors</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each mentor oversees one batch across all subjects &amp; semesters. One mentor per batch.
            </p>
          </div>
        </div>

        {/* ── Assign New Mentor Form ── */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-blue-500" /> Assign New Mentor
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5 w-40">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Batch Year</Label>
              <Select value={mentorBatchYear} onValueChange={setMentorBatchYear}>
                <SelectTrigger className="h-9 text-sm border-border">
                  <SelectValue placeholder="e.g. 2024-25" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatchYears.length === 0 ? (
                    <SelectItem value="_none" disabled>All batches have mentors</SelectItem>
                  ) : (
                    availableBatchYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Select Faculty</Label>
              <Select value={topMentorId} onValueChange={setTopMentorId}>
                <SelectTrigger className="h-9 text-sm border-border">
                  <SelectValue placeholder="Choose a faculty member" />
                </SelectTrigger>
                <SelectContent>
                  {availableFacultyForAssign.length === 0 ? (
                    <SelectItem value="_none" disabled>No available faculty</SelectItem>
                  ) : (
                    availableFacultyForAssign.map(f => (
                      <SelectItem key={f._id} value={f._id}>
                        {f.name}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({f.role === 'mentor' ? 'Mentor' : f.role === 'subject_coordinator' ? 'Coordinator' : 'Faculty'})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleAssignNewMentor}
              disabled={!mentorBatchYear || !topMentorId || assignMentor.isPending}
              className="h-9 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {assignMentor.isPending ? 'Assigning...' : 'Assign Mentor'}
            </button>
          </div>
        </div>

        {/* ── Existing Mentor Assignments ── */}
        <div>
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" /> Current Assignments ({allBatches.filter(b => b.mentor).length})
            </p>
          </div>

          {allBatches.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-muted-foreground">
              No students yet. Add students with a batch year to start assigning mentors.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allBatches.map((batch, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Batch {batch.batchYear}
                        <span className="text-muted-foreground font-normal ml-2 text-xs">{batch.studentCount} students</span>
                      </p>
                      {batch.mentor ? (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{batch.mentor.name}</span>
                          <span className="text-muted-foreground">({batch.mentor.email})</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                          ⚠ No mentor assigned — use the form above
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Change Mentor UI */}
                  <div>
                    {batch.mentor && (
                      changingBatch === batch.batchYear ? (
                        <div className="flex items-center gap-2">
                          <Select value={changeMentorId} onValueChange={setChangeMentorId}>
                            <SelectTrigger className="h-8 text-xs border-border w-48">
                              <SelectValue placeholder="Select new mentor" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableFacultyForChange(batch.mentor._id)
                                .filter(f => f._id !== batch.mentor._id) // exclude current
                                .map(m => (
                                  <SelectItem key={m._id} value={m._id}>
                                    {m.name} ({m.role === 'mentor' ? 'Mentor' : 'Faculty'})
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                          <button onClick={handleChangeMentor}
                            disabled={!changeMentorId || assignMentor.isPending}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-primary-foreground rounded-lg font-medium disabled:opacity-50 transition-colors">
                            {assignMentor.isPending ? '...' : 'Save'}
                          </button>
                          <button onClick={() => { setChangingBatch(null); setChangeMentorId('') }}
                            className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setChangingBatch(batch.batchYear); setChangeMentorId('') }}
                          className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-100 flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Change Mentor
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ ADD SUBJECT FORM ═══ */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Plus className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">Add Subject</p>
        </div>
        <form onSubmit={addSubject} className="px-5 py-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Subject Name</Label>
            <Input className="h-9 text-sm border-border" placeholder="DBMS, OS, CN..." value={subjectName}
              onChange={e => setSubjectName(e.target.value)} required />
          </div>
          <div className="space-y-1.5 w-32">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Semester</Label>
            <Select value={subjectSem} onValueChange={setSubjectSem}>
              <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Sem" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: dept?.totalSemesters || 0 }, (_, i) => i + 1).map(s => (
                  <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button type="submit" disabled={createSubject.isPending}
            className="h-9 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors">
            {createSubject.isPending ? 'Adding...' : 'Add Subject'}
          </button>
        </form>
      </div>

      {/* ═══ SEMESTER OVERVIEW ═══ */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">Semester Overview</p>
        </div>

        <div className="divide-y divide-border">
          {semesters.map(sem => {
            const isExpanded = expandedSem === sem.semester
            const isLastSem = sem.semester === dept?.totalSemesters

            return (
              <div key={sem.semester}>
                <button onClick={() => toggleSem(sem.semester)}
                  className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-violet-700">{sem.semester}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Semester {sem.semester}
                        <span className="text-muted-foreground font-normal ml-1">(Year {Math.ceil(sem.semester / 2)})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sem.subjects.length} subjects · {sem.studentCount} students
                        {sem.batches.length > 0 && ` · ${sem.batches.length} batch${sem.batches.length > 1 ? 'es' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                      <Users className="h-3 w-3 inline mr-1" />{sem.studentCount}
                    </span>
                    {sem.studentCount > 0 && !isLastSem && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePromote(sem.semester) }}
                        disabled={promote.isPending}
                        className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <ArrowUpRight className="h-3 w-3 inline mr-1" />
                        {promote.isPending ? 'Promoting...' : 'Promote'}
                      </button>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 bg-muted/50">
                    {/* Subjects */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                        Subjects ({sem.subjects.length})
                      </p>
                      {sem.subjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-1">No subjects added yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {sem.subjects.map(sub => (
                            <div key={sub._id} className="flex items-center justify-between bg-background rounded-lg border border-border px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{sub.name}</p>
                                  {sub.faculty ? (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                      <User className="h-3 w-3" /> {sub.faculty.name}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No faculty assigned</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignSubjectId === sub._id ? (
                                  <div className="flex items-center gap-2">
                                    <Select value={assignFacultyId} onValueChange={setAssignFacultyId}>
                                      <SelectTrigger className="h-7 text-xs border-border w-40">
                                        <SelectValue placeholder="Select faculty" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {teachers.map(f => (
                                          <SelectItem key={f._id} value={f._id}>
                                            {f.name} {f.department ? `(${f.department})` : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <button onClick={handleAssignFaculty}
                                      disabled={!assignFacultyId || assignFaculty.isPending}
                                      className="text-xs px-2 py-1 bg-violet-600 text-primary-foreground rounded font-medium disabled:opacity-50">
                                      {assignFaculty.isPending ? '...' : 'Assign'}
                                    </button>
                                    <button onClick={() => { setAssignSubjectId(null); setAssignFacultyId('') }}
                                      className="text-xs text-muted-foreground hover:text-muted-foreground">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setAssignSubjectId(sub._id); setAssignFacultyId(sub.faculty?._id || '') }}
                                    className="text-xs px-2 py-1 text-violet-600 hover:bg-violet-50 rounded transition-colors font-medium">
                                    {sub.faculty ? 'Change' : 'Assign Faculty'}
                                  </button>
                                )}
                                <button onClick={() => { if (confirm(`Delete "${sub.name}"?`)) deleteSubject.mutate(sub._id) }}
                                  className="text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Batches in this semester */}
                    {sem.batches.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                          Batches in Sem {sem.semester}
                        </p>
                        <div className="space-y-1.5">
                          {sem.batches.map((batch, i) => (
                            <div key={i} className="flex items-center gap-3 bg-background rounded-lg border border-border px-4 py-2.5">
                              <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                              <p className="text-sm text-foreground/80">
                                <span className="font-medium">{batch.batchYear}</span>
                                <span className="text-muted-foreground ml-1">({batch.studentCount} students)</span>
                                {batch.mentor && (
                                  <span className="text-green-600 ml-2 text-xs">
                                    · Mentor: {batch.mentor.name}
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {semesters.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No semesters found.</div>
        )}
      </div>
    </div>
  )
}
