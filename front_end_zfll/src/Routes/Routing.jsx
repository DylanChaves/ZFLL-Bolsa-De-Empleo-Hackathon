import React from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import EmpresaPage from '../Pages/Empresa/empresaPage'
import Homepage from '../Pages/Homepage/Homepage'
import AuthPage from '../Pages/Login_Regist/AuthPage'
import AdminPanel from '../Pages/AdminPanel/AdminPanel'
import InstintucionPage from '../Pages/Instintucion/InstintucionPage'
import NotificationPreferences from '../Components/notifications/NotificationPreferences'
import AspirantePage from '../Pages/PerfilAspirante/AspirantePage'
import Login from '../Pages/Login_Admin/Login'



// ✅ useNavigate va en un componente separado, DENTRO del Router
function AppRoutes() {
    const navigate = useNavigate();

  // ✅ Redirige según el rol que devuelve el backend
  const handleLoginSuccess = (data) => {
    const role = data.user?.role;

    if (role === 'aspirante')   return navigate('/perfil-aspirante');
    if (role === 'empresa')     return navigate('/perfil-empresa');
    if (role === 'institucion') return navigate('/perfil-institucion');

    // Si no tiene rol definido, va al home 
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/PanelAdmin" element={<AdminPanel />} />
      <Route path="/notificaciones/preferencias" element={<NotificationPreferences />} />
      
      <Route path="/login-admin" element={<Login />} />

      <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/perfil-aspirante" element={<AspirantePage />} />
      <Route path="/perfil-empresa" element={<EmpresaPage />} />       {/* ← cambia por tu página real */}
      <Route path="/perfil-institucion" element={<InstintucionPage />} /> {/* ← cambia por tu página real */}

    </Routes>
  )
}

function Routing() {
  return (
    <Router>
      <AppRoutes /> {/* ← AppRoutes va dentro del Router */}
    </Router>
  )
}

export default Routing