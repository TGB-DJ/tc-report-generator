import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageEvents from "./pages/admin/ManageEvents";
import ManageNotifications from "./pages/admin/ManageNotifications";
import ManageAdmins from "./pages/admin/ManageAdmins";
import Reports from "./pages/admin/Reports";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import TCGenerator from "./pages/student/TCGenerator";
import UniversityMarkSheet from "./pages/student/UniversityMarkSheet";
import AttendanceMarker from "./pages/teacher/AttendanceMarker";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />


            <Route element={<ProtectedRoute allowedRoles={['admin', 'hod']} />}>
              <Route element={<Layout />}>
                <Route path="/admin/students" element={<ManageStudents />} />
                <Route path="/admin/teachers" element={<ManageTeachers />} />
                <Route path="/admin/events" element={<ManageEvents />} />
                <Route path="/admin/notifications" element={<ManageNotifications />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/admins" element={<ManageAdmins />} />
                <Route path="/admin/reports" element={<Reports />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['teacher', 'hod']} />}>
              <Route element={<Layout />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/attendance" element={<AttendanceMarker />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route element={<Layout />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/tc" element={<TCGenerator />} />
                <Route path="/student/marks" element={<UniversityMarkSheet />} />
                {/* Add other student routes here */}
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
