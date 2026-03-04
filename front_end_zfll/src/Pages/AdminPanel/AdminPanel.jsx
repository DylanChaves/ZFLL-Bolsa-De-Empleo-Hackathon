import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import Sidebar       from '../../Components/Admin/Sidebar/Sidebar';
import Topbar        from '../../Components/Admin/Topbar/Topbar';
import Dashboard     from '../../Components/Admin/Dashboard/Dashboard';
import Companies     from '../../Components/Admin/Companies/Companies';
import Institutions  from '../../Components/Admin/Institutions/Institutions';
import Aspirants     from '../../Components/Admin/Aspirants/Aspirants';
import Vacancies     from '../../Components/Admin/Vacancies/Vacancies';
import Forms         from '../../Components/Admin/Forms/Forms';
import Admins        from '../../Components/Admin/Admins';

import { getPendingCompanies }    from '../../Services/Admin/Companyservice.js';
import { getPendingInstitutions } from '../../Services/Admin/institutionService.js';

import styles from './AdminPanel.module.css';

/* ─── Títulos visibles en el header de página ─── */
const PAGE_TITLES = {
  dashboard:           { title: 'Dashboard',                 sub: 'Resumen general de la plataforma.' },
  companies:           { title: 'Empresas',                  sub: 'Gestiona las empresas registradas.' },
  institutions:        { title: 'Instituciones',             sub: 'Gestiona las instituciones educativas.' },
  aspirants:           { title: 'Aspirantes',                sub: 'Gestiona los perfiles de aspirantes.' },
  vacancies:           { title: 'Vacantes Pendientes',       sub: 'Aprueba o rechaza solicitudes de vacantes.' },
  forms:               { title: 'Formularios de Registro',   sub: 'Revisa solicitudes de nuevas cuentas.' },
  admins:              { title: 'Administradores',           sub: 'Gestiona los usuarios del panel.' },
  search_companies:    { title: 'Búsqueda de Empresas',      sub: null },
  search_institutions: { title: 'Búsqueda de Instituciones', sub: null },
  search_aspirants:    { title: 'Búsqueda de Aspirantes',    sub: null },
};

/* ─── Render de cada sección ─── */
const renderSection = (tab, onPendingChange) => {
  switch (tab) {
    case 'dashboard':    return <Dashboard />;
    case 'companies':    return <Companies />;
    case 'institutions': return <Institutions />;
    case 'aspirants':    return <Aspirants />;
    case 'vacancies':    return <Vacancies onCountChange={(n) => onPendingChange('vacancies', n)} />;
    case 'forms':        return <Forms onCountChange={(n) => onPendingChange('forms', n)} />;
    case 'admins':       return <Admins />;
    case 'search_companies':
    case 'search_institutions':
    case 'search_aspirants':
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          Módulo "{PAGE_TITLES[tab]?.title}" — próximamente.
        </div>
      );
    default:
      return null;
  }
};

/* ─── AdminPanel ─── */
const AdminPanel = () => {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [pendingCounts, setPendingCounts] = useState({ vacancies: 0, forms: 0 });

  // Leer usuario real del localStorage (guardado en Login.jsx)
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name:  u.name  || u.email?.split('@')[0] || 'Admin',
          email: u.email || '',
          role:  u.role  || 'admin',
        };
      }
    } catch (_) { /* ignore */ }
    return { name: 'Admin', email: '', role: 'admin' };
  })();

  // Cargar conteos reales al montar
  useEffect(() => {
    Promise.all([
      getPendingCompanies().catch(() => []),
      getPendingInstitutions().catch(() => []),
    ]).then(([companies, institutions]) => {
      setPendingCounts(prev => ({
        ...prev,
        forms: (companies?.length ?? 0) + (institutions?.length ?? 0),
      }));
    });
  }, []);

  const handlePendingChange = (key, count) => {
    setPendingCounts(prev => ({ ...prev, [key]: count }));
  };

  const page = PAGE_TITLES[activeTab] || { title: activeTab, sub: null };

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        currentUser={currentUser}
        pendingCounts={pendingCounts}
      />

      {/* Overlay mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className={styles.main}>
        <Topbar activeTab={activeTab} onMenuToggle={() => setSidebarOpen(o => !o)} />

        <main className={styles.content}>
          <div className={styles.contentInner}>
            {/* Header de página */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>{page.title}</h1>
                {page.sub && <p className={styles.pageSubtitle}>{page.sub}</p>}
              </div>
              <div className={styles.pageDate}>
                <p className={styles.pageDateLabel}>Fecha Actual</p>
                <p className={styles.pageDateValue}>{today}</p>
              </div>
            </div>

            {/* Contenido animado */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderSection(activeTab, handlePendingChange)}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
