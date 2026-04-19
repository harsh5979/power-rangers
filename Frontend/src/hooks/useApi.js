import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

// ── Generic paginated fetcher ─────────────────────────────────
const fetchPage = (url, params) => api.get(url, { params }).then(r => r.data)

// ── Students ──────────────────────────────────────────────────
export const useStudents = (params = {}) =>
  useQuery({
    queryKey: ['students', params],
    queryFn:  () => fetchPage('/students', params),
  })

export const useStudent = (id) =>
  useQuery({
    queryKey: ['students', id],
    queryFn:  () => api.get(`/students/${id}`).then(r => r.data),
    enabled:  !!id,
  })

export const useMyProfile = () =>
  useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => api.get('/students/my-profile').then(r => r.data),
  })

export const useCreateStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data => api.post('/students', data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['students'], exact: false }); toast.success('Student created!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useBulkCreateStudents = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: students => api.post('/students/bulk', { students }).then(r => r.data),
    onSuccess: d => {
      qc.invalidateQueries({ queryKey: ['students'], exact: false })
      if (d.created.length) toast.success(`✅ ${d.created.length} student${d.created.length > 1 ? 's' : ''} imported successfully!`)
      if (d.failed.length) {
        d.failed.forEach(f => toast.error(`❌ ${f.email}: ${f.reason}`, { duration: 6000 }))
      }
    },
    onError: e => toast.error(e.response?.data?.error || 'Import failed'),
  })
}

export const useUpdateStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/students/${id}`, data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['students'], exact: false }); toast.success('Updated!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Update failed'),
  })
}

export const useDeleteStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.delete(`/students/${id}`).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['students'], exact: false }); toast.success('Deleted') },
    onError:    e  => toast.error(e.response?.data?.error || 'Delete failed'),
  })
}

export const useBulkDeleteStudents = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ids => api.delete('/students/bulk', { data: { ids } }).then(r => r.data),
    onSuccess:  d  => { qc.invalidateQueries({ queryKey: ['students'], exact: false }); toast.success(d.message) },
    onError:    e  => toast.error(e.response?.data?.error || 'Delete failed'),
  })
}

// ── Faculty (principal + college_admin manage) ────────────────
const facultyBase = (role) => role === 'college_admin' ? '/college-admin/faculty' : '/principal/faculty'

export const useFaculty = (params = {}) => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['faculty', params],
    queryFn:  () => fetchPage(facultyBase(user?.role), params),
  })
}

export const useCreateFaculty = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: data => api.post(facultyBase(user?.role), data).then(r => r.data),
    onSuccess:  d => { qc.invalidateQueries({ queryKey: ['faculty'], exact: false }); toast.success(d.message) },
    onError:    e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useUpdateFaculty = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`${facultyBase(user?.role)}/${id}`, data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['faculty'], exact: false }); toast.success('Updated!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Update failed'),
  })
}

export const useDeleteFaculty = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: id => api.delete(`${facultyBase(user?.role)}/${id}`).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['faculty'], exact: false }); toast.success('Deleted') },
    onError:    e  => toast.error(e.response?.data?.error || 'Delete failed'),
  })
}

// ── College (admin) ───────────────────────────────────────────
export const useStudentMarks = (studentId) =>
  useQuery({
    queryKey: ['marks', studentId],
    queryFn:  () => api.get(`/marks/${studentId}`).then(r => r.data),
    enabled:  !!studentId,
  })

export const useUploadMarks = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: records => api.post('/marks', { records }).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks saved!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── Attendance ────────────────────────────────────────────────
export const useStudentAttendance = (studentId) =>
  useQuery({
    queryKey: ['attendance', studentId],
    queryFn:  () => api.get(`/attendance/${studentId}`).then(r => r.data),
    enabled:  !!studentId,
  })

export const useUploadAttendance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: records => api.post('/attendance', { records }).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Attendance saved!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── College (admin) ───────────────────────────────────────────
export const useMyCollege = () =>
  useQuery({ queryKey: ['my-college'], queryFn: () => api.get('/college-admin/college').then(r => r.data) })

export const useUpdateMyCollege = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data => api.patch('/college-admin/college', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-college'] }); toast.success('College updated!') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useMyCollegePrincipal = () =>
  useQuery({ queryKey: ['my-college-principal'], queryFn: () => api.get('/college-admin/principal').then(r => r.data) })

export const useCreateMyPrincipal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data => api.post('/college-admin/principal', data).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['my-college-principal'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useDeleteMyPrincipal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.delete(`/college-admin/principal/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-college-principal'] }); toast.success('Deleted') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── Departments (college admin) ───────────────────────────────
export const useDepartments = () =>
  useQuery({ queryKey: ['departments'], queryFn: () => api.get('/college-admin/departments').then(r => r.data) })

export const useCreateDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data => api.post('/college-admin/departments', data).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useUpdateDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/college-admin/departments/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Updated!') },
    onError: e => toast.error(e.response?.data?.error || 'Update failed'),
  })
}

export const useDeleteDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.delete(`/college-admin/departments/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Deleted') },
    onError: e => toast.error(e.response?.data?.error || 'Delete failed'),
  })
}

// Department overview (semesters, subjects, batches)
export const useDepartmentOverview = (deptId) =>
  useQuery({
    queryKey: ['dept-overview', deptId],
    queryFn: () => api.get(`/college-admin/departments/${deptId}/overview`).then(r => r.data),
    enabled: !!deptId,
  })

// Subjects
export const useCreateSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ deptId, ...data }) => api.post(`/college-admin/departments/${deptId}/subjects`, data).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useUpdateSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/college-admin/subjects/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); toast.success('Subject updated!') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useDeleteSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.delete(`/college-admin/subjects/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); toast.success('Subject deleted') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// Assign faculty to subject
export const useAssignFaculty = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, facultyId }) => api.put(`/college-admin/subjects/${subjectId}/assign-faculty`, { facultyId }).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// Assign mentor to batch
export const useAssignMentor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ deptId, mentorId, batchYear, change }) => api.post(`/college-admin/departments/${deptId}/assign-mentor`, { mentorId, batchYear, change }).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); qc.invalidateQueries({ queryKey: ['faculty-list'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// Promote students
export const usePromoteStudents = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ deptId, fromSemester }) => api.post(`/college-admin/departments/${deptId}/promote`, { fromSemester }).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['dept-overview'] }); qc.invalidateQueries({ queryKey: ['students'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// Faculty list for assignment dropdowns
export const useFacultyList = () =>
  useQuery({ queryKey: ['faculty-list'], queryFn: () => api.get('/college-admin/faculty-list').then(r => r.data) })


// ── College (admin) ───────────────────────────────────────────
export const useCollegeAdmins = (params = {}) =>
  useQuery({ queryKey: ['college-admins', params], queryFn: () => fetchPage('/admin/college-admins', params) })

export const useCreateCollegeAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data => api.post('/admin/college-admins', data).then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['college-admins'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useDeleteCollegeAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.delete(`/admin/college-admins/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['college-admins'] }); toast.success('Deleted') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useColleges = () =>
  useQuery({ queryKey: ['colleges'], queryFn: () => api.get('/admin/colleges').then(r => r.data) })

export const useUpdateCollege = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/colleges/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['colleges'] }); toast.success('College updated!') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

export const useAutoSemester = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/admin/auto-semester').then(r => r.data),
    onSuccess: d => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success(d.message) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── Faculty info + subjects ───────────────────────────────────
export const useMyFacultyInfo = () =>
  useQuery({ queryKey: ['faculty-info'], queryFn: () => api.get('/faculty/my-info').then(r => r.data) })

export const useSubjectSummary = (subject) =>
  useQuery({
    queryKey: ['subject-summary', subject],
    queryFn:  () => api.get('/faculty/subject-summary', { params: { subject } }).then(r => r.data),
    enabled:  !!subject,
  })

export const useUpdateMySubjects = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: subjects => api.patch('/faculty/subjects', { subjects }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['faculty-info'] }); toast.success('Subjects updated!') },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── Principal/CollegeAdmin college info ───────────────────────
export const useCollegeInfo = (role) =>
  useQuery({
    queryKey: ['college-info', role],
    queryFn:  () => {
      const url = role === 'college_admin' ? '/college-admin/college' : '/principal/college-info'
      return api.get(url).then(r => r.data)
    },
    enabled: !!role,
  })

// ── Risk ──────────────────────────────────────────────────────
export const useRiskSummary = () =>
  useQuery({
    queryKey: ['risk-summary'],
    queryFn:  () => api.get('/risk/summary').then(r => r.data),
  })

export const useRecalcRisk = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: studentId => api.post(`/risk/calculate/${studentId}`).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Risk updated!') },
    onError:    e  => toast.error(e.response?.data?.error || 'Failed'),
  })
}

// ── Alerts ────────────────────────────────────────────────────
export const useAlerts = () =>
  useQuery({
    queryKey: ['alerts'],
    queryFn:  () => api.get('/alerts/my').then(r => r.data),
  })

export const useMarkAlertRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: id => api.patch(`/alerts/${id}/read`).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}
