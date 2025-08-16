import { Route, Routes, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.tsx'
import TeacherDashboard from './pages/teacher/TeacherDashboard.tsx'
import TeacherStudentSnapshot from './pages/teacher/TeacherStudentSnapshot.tsx'
import ParentDashboard from './pages/parent/ParentDashboard.tsx'
import StudentDashboard from './pages/student/StudentDashboard.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/student/:id" element={<TeacherStudentSnapshot />} />
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
