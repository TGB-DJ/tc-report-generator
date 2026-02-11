import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageAdmins from "./pages/admin/ManageAdmins";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import TCGenerator from "./pages/student/TCGenerator";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<ManageStudents />} />
              <Route path="/admin/teachers" element={<ManageTeachers />} />
              <Route path="/admin/admins" element={<ManageAdmins />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['teacher', 'hod']} />}>
            <Route element={<Layout />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              {/* Add other teacher routes here */}
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<Layout />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/tc" element={<TCGenerator />} />
              {/* Add other student routes here */}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
