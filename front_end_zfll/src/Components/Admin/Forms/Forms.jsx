import { useState, useEffect } from 'react';
import { Building2, GraduationCap, ChevronRight, FileText, XCircle, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import Card from '../Card/Card.jsx';
import styles from './Forms.module.css';
import { getPendingCompanies, updateCompanyStatus }     from '../../../Services/Admin/Companyservice.js';
import { getPendingInstitutions, updateInstitutionStatus } from '../../../Services/Admin/institutionService.js';

const Forms = () => {
  const [activeTab, setActiveTab]       = useState('companies');
  const [companies, setCompanies]       = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);

  // Carga inicial desde la API real
  useEffect(() => {
    setFetching(true);
    Promise.all([
      getPendingCompanies(),
      getPendingInstitutions(),
    ]).then(([comp, inst]) => {
      setCompanies(comp);
      setInstitutions(inst);
    }).finally(() => setFetching(false));
  }, []);

  const currentList = activeTab === 'companies' ? companies : institutions;

  // true  = aprobar (activa = true en Django)
  // false = rechazar (activa = false en Django)
  const handleAction = async (approve) => {
    if (!selected) return;
    setLoading(true);
    try {
      if (activeTab === 'companies') {
        await updateCompanyStatus(selected.id, approve);
        setCompanies(prev => prev.filter(c => c.id !== selected.id));
      } else {
        await updateInstitutionStatus(selected.id, approve);
        setInstitutions(prev => prev.filter(i => i.id !== selected.id));
      }
      setSelected(null);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.grid}>
      {/* ── Lista lateral ── */}
      <Card>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'companies' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('companies'); setSelected(null); }}
          >
            Empresas ({companies.length})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'institutions' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('institutions'); setSelected(null); }}
          >
            Instituciones ({institutions.length})
          </button>
        </div>

        <div className={styles.listScroll}>
          {fetching ? (
            <div className={styles.fetchingState}>
              <Loader2 size={24} className={styles.spinner} />
              <p>Cargando solicitudes...</p>
            </div>
          ) : currentList.length === 0 ? (
            <p className={styles.emptyList}>No hay solicitudes pendientes</p>
          ) : (
            currentList.map(item => (
              <div
                key={item.id}
                className={`${styles.listItem} ${selected?.id === item.id ? styles.listItemActive : ''}`}
                onClick={() => setSelected(item)}
              >
                <div className={styles.listItemLeft}>
                  <div className={`${styles.listIcon} ${activeTab === 'companies' ? styles.listIconCompany : styles.listIconInstitution}`}>
                    {activeTab === 'companies' ? <Building2 size={20} /> : <GraduationCap size={20} />}
                  </div>
                  <div>
                    <p className={styles.listName}>{item.name}</p>
                    <p className={styles.listDate}>{item.registrationDate || 'Sin fecha'}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Detalle ── */}
      <Card>
        {selected ? (
          <>
            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{selected.name}</h3>
                <p className={styles.detailSub}>Revisión de solicitud de registro</p>
              </div>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.btnReject}
                  onClick={() => handleAction(false)}
                  disabled={loading}
                >
                  <XCircle size={18} /> Rechazar
                </button>
                <button
                  type="button"
                  className={styles.btnApprove}
                  onClick={() => handleAction(true)}
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 size={16} className={styles.spinnerSmall} /> Procesando...</>
                    : <><CheckCircle2 size={18} /> Aprobar</>
                  }
                </button>
              </div>
            </div>

            <div className={styles.detailBody}>
              <div className={styles.detailGrid}>
                <div>
                  <p className={styles.fieldLabel}>Razón Social / Nombre</p>
                  <p className={styles.fieldValue}>{selected.name || '—'}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Cédula Jurídica</p>
                  <p className={styles.fieldMono}>{selected.legalId || '—'}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Ubicación</p>
                  <p className={styles.fieldValue}>{selected.location || '—'}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Teléfono</p>
                  <p className={styles.fieldValue}>{selected.phone || '—'}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Correo Electrónico</p>
                  <p className={styles.fieldValue}>{selected.email || '—'}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Contacto</p>
                  <p className={styles.fieldValue}>{selected.contactName || '—'}</p>
                </div>
                {selected.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className={styles.fieldLabel}>Descripción</p>
                    <p className={styles.fieldValue}>{selected.description}</p>
                  </div>
                )}
              </div>

              <div className={styles.securityBox}>
                <h4 className={styles.securityTitle}><Shield size={18} /> Verificación de Seguridad</h4>
                <p className={styles.securityText}>
                  Verifique que la documentación adjunta coincida con los datos. Una vez aprobada, la cuenta tendrá acceso completo a la plataforma.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.detailEmpty}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Selecciona una solicitud</h3>
            <p className={styles.emptyText}>Elige una empresa o institución de la lista lateral para revisar sus detalles y gestionar su acceso.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Forms;