import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Kecamatan from "@/pages/Kecamatan";
import Desa from "@/pages/Desa";
import Keluarga from "@/pages/Keluarga";
import Periode from "@/pages/Periode";
import Pengguna from "@/pages/Pengguna";
import Pengaturan from "@/pages/Pengaturan";

const P = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/upload" element={<P><Upload /></P>} />
            <Route path="/kecamatan" element={<P><Kecamatan /></P>} />
            <Route path="/desa" element={<P><Desa /></P>} />
            <Route path="/keluarga" element={<P><Keluarga /></P>} />
            <Route path="/periode" element={<P><Periode /></P>} />
            <Route path="/pengguna" element={<P><Pengguna /></P>} />
            <Route path="/pengaturan" element={<P><Pengaturan /></P>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
