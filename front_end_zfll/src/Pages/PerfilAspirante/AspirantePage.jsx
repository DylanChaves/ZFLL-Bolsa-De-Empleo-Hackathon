/**
 * AspirantePage.jsx
 * Layout raíz del perfil Aspirante.
 * Carga los datos del usuario autenticado (cuenta + perfil aspirante) y los muestra.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, getPerfilAspirante } from '../../Services/meServices';
import Sidebar            from '../../Components/PerfilAspirante/Sidebar/Sidebar';
import Navbar             from '../../Components/PerfilAspirante/Navbar/Navbar';
import DashboardAspirante from '../../Components/PerfilAspirante/DashboardAspirante/DashboardAspirante';
import PersonalData       from '../../Components/PerfilAspirante/PersonalData/PersonalData';
import PerfilProfesional  from '../../Components/PerfilAspirante/PerfilProfesional/PerfilProfesional';
import Postulaciones      from '../../Components/PerfilAspirante/Postulaciones/Postulaciones';
import ApplyModal         from '../../Components/PerfilAspirante/ApplyModal/ApplyModal';
import './AspirantePage.css';

const AspirantePage = ({ usuario: usuarioProp = null, onLogout: onLogoutProp }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(usuarioProp);
  const [loading, setLoading] = useState(!usuarioProp);
  const [activeView,  setActiveView]  = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApply,   setShowApply]   = useState(false);
  const [toast,       setToast]       = useState('');

  useEffect(() => {
    if (usuarioProp) {
      setUsuario(usuarioProp);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    const stored = localStorage.getItem('user');
    const storedUser = stored ? JSON.parse(stored) : null;

    const load = async () => {
      try {
        const me = await getMe();
        let perfil = null;
        try {
          perfil = await getPerfilAspirante();
        } catch {
          // Perfil aspirante puede no existir aún (404)
        }
        setUsuario({
          id: me.id,
          email: me.email,
          phone: me.phone,
          role: storedUser?.role ?? 'aspirante',
          nombre_completo: perfil?.nombre_completo || storedUser?.name || me.email?.split('@')[0] || 'Aspirante',
          ...perfil,
        });
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, usuarioProp]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    if (onLogoutProp) onLogoutProp();
    else navigate('/login');
  };

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const renderView = () => {
    switch (activeView) {
      case 'personal':
        return <PersonalData usuario={usuario} onNotify={notify} />;
      case 'perfil':
        return <PerfilProfesional perfil={usuario || {}} onNotify={notify} />;
      case 'postulaciones':
        return <Postulaciones />;
      default:
        return (
          <DashboardAspirante
            usuario={usuario}
            onApply={(job) => { setSelectedJob(job); setShowApply(true); }}
            onNotify={notify}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="ap-root ap-loading">
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="ap-root">
      <Navbar usuario={usuario} onLogout={handleLogout} />

      <div className="ap-body">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          perfilCompletado={90}
        />

        <main className="ap-main">
          {renderView()}
        </main>
      </div>

      <ApplyModal
        job={selectedJob}
        isOpen={showApply}
        onClose={() => setShowApply(false)}
        onSubmit={() => { notify('¡Postulación enviada correctamente!'); setShowApply(false); }}
      />

      {toast && (
        <div className="ap-toast">
          <span className="ap-toast-dot" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default AspirantePage;