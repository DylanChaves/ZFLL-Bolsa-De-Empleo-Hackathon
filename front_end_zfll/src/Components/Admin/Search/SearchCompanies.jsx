import { useState, useEffect, useCallback } from 'react';
import { Search, X, Building2, MapPin, Mail, Phone, Eye } from 'lucide-react';
import Card from '../Card/Card';
import Modal from '../Modal/Modal';
import StatusBadge from '../StatusBadge/StatusBadge';
import { getCompanies } from '../../../Services/Admin/Companyservice';
import styles from './Search.module.css';

const CANTONES = [
  'San José','Escazú','Desamparados','Puriscal','Tarrazú','Aserrí','Mora','Goicoechea',
  'Santa Ana','Alajuelita','Vásquez de Coronado','Acosta','Tibás','Moravia','Montes de Oca',
  'Turrubares','Dota','Curridabat','Pérez Zeledón','León Cortés Castro','Alajuela','San Ramón',
  'Grecia','San Mateo','Atenas','Naranjo','Palmares','Poás','Orotina','San Carlos','Zarcero',
  'Sarchí','Upala','Los Chiles','Guatuso','Río Cuarto','Cartago','Paraíso','La Unión',
  'Jiménez','Turrialba','Alvarado','Oreamuno','El Guarco','Heredia','Barva','Santo Domingo',
  'Santa Bárbara','San Rafael','San Isidro','Belén','Flores','San Pablo','Sarapiquí',
  'Liberia','Nicoya','Santa Cruz','Bagaces','Carrillo','Cañas','Abangares','Tilarán',
  'Nandayure','La Cruz','Hojancha','Puntarenas','Esparza','Buenos Aires','Montes de Oro',
  'Osa','Quepos','Golfito','Coto Brus','Parrita','Corredores','Garabito','Puerto Viejo',
  'Limón','Pococí','Siquirres','Talamanca','Matina','Guácimo',
];

const STATUS_OPTIONS = [
  { value: '',           label: 'Todos los estados' },
  { value: 'aprobada',   label: 'Aprobada' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'desactivada',label: 'Desactivada' },
];

const SearchCompanies = () => {
  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [canton, setCanton]     = useState('');
  const [status, setStatus]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCompanies()
      .then(data => setAll(data))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const results = all.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.legalId.toLowerCase().includes(q) ||
      c.contactName?.toLowerCase().includes(q);
    const matchC = !canton || c.location === canton;
    const matchS = !status || c.status === status;
    return matchQ && matchC && matchS;
  });

  const clearFilters = () => { setQuery(''); setCanton(''); setStatus(''); };
  const hasFilters = query || canton || status;

  return (
    <>
      <Card>
        {/* ── Barra de búsqueda principal ── */}
        <div className={styles.heroSearch}>
          <div className={styles.heroIcon}><Building2 size={20} /></div>
          <input
            className={styles.heroInput}
            placeholder="Buscar por nombre, correo, cédula jurídica o contacto…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Filtros secundarios ── */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Cantón</label>
            <select
              className={styles.filterSelect}
              value={canton}
              onChange={e => setCanton(e.target.value)}
            >
              <option value="">Todos los cantones</option>
              {CANTONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado</label>
            <select
              className={styles.filterSelect}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button className={styles.clearAllBtn} onClick={clearFilters}>
              <X size={14} /> Limpiar filtros
            </button>
          )}
          <span className={styles.resultCount}>
            {loading ? 'Cargando…' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── Resultados ── */}
        <div className={styles.grid}>
          {loading ? (
            <p className={styles.empty}>Cargando empresas…</p>
          ) : results.length === 0 ? (
            <p className={styles.empty}>No se encontraron empresas con esos criterios.</p>
          ) : results.map(c => (
            <div key={c.id} className={styles.card} onClick={() => setSelected(c)}>
              <div className={styles.cardHeader}>
                <div className={styles.cardAvatar}>
                  {c.name?.[0]?.toUpperCase() ?? 'E'}
                </div>
                <div className={styles.cardTitles}>
                  <span className={styles.cardName}>{c.name}</span>
                  <span className={styles.cardSub}>{c.legalId || 'Sin cédula'}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className={styles.cardBody}>
                {c.location && (
                  <span className={styles.cardMeta}>
                    <MapPin size={13} /> {c.location}
                  </span>
                )}
                {c.email && (
                  <span className={styles.cardMeta}>
                    <Mail size={13} /> {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className={styles.cardMeta}>
                    <Phone size={13} /> {c.phone}
                  </span>
                )}
              </div>
              <button className={styles.viewBtn}>
                <Eye size={14} /> Ver detalles
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Modal detalles ── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle de Empresa"
      >
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              ['Razón Social',     selected.name],
              ['Cédula Jurídica',  selected.legalId],
              ['Cantón',           selected.location],
              ['Teléfono',         selected.phone],
              ['Correo',           selected.email],
              ['Persona Contacto', selected.contactName],
              ['Registro',         selected.registrationDate],
            ].map(([label, val]) => val ? (
              <div key={label}>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontWeight: 500, color: '#0f172a', wordBreak: 'break-all' }}>{val}</p>
              </div>
            ) : null)}
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Estado</p>
              <StatusBadge status={selected.status} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SearchCompanies;
