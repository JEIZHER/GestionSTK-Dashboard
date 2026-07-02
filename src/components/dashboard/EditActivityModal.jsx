import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EditActivityModal({ isOpen, onClose, activity, onSave, theme, isDark, user, cuenta }) {
  const [activeTab, setActiveTab] = useState('rendicion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [fecha, setFecha] = useState('');
  
  // Rendicion state
  const [rendicionData, setRendicionData] = useState({
    rec_cte: 0, ent_cte: 0, dev_cte: 0,
    rec_ext: 0, ent_ext: 0, dev_ext: 0,
    rec_cod: 0, ent_cod: 0, dev_cod: 0,
    rec_pxp: 0, ent_pxp: 0, dev_pxp: 0,
    kpi_logrado: false,
    datos_custom: {}
  });

  // Precision state
  const [precisionData, setPrecisionData] = useState({
    total_ofs: 0,
    matches_directos: 0,
    sugerencias_aceptadas: 0,
    sugerencias_rechazadas: 0,
    contactos_manuales: 0,
    precision_percent: 0,
    detalles: null // We keep it as a string to preserve structure, or parse it if needed
  });

  useEffect(() => {
    if (isOpen && activity) {
      setFecha(activity.fecha || '');
      
      if (activity.rendicion) {
        // Parse existing custom data
        const existingCustom = typeof activity.rendicion.datos_custom === 'string'
          ? JSON.parse(activity.rendicion.datos_custom)
          : (activity.rendicion.datos_custom || {});

        // Merge with all custom tariff names from cuenta so no key is missing
        const mergedCustom = { ...existingCustom };
        try {
          const tarifas = cuenta?.tarifas_custom
            ? (typeof cuenta.tarifas_custom === 'string' ? JSON.parse(cuenta.tarifas_custom) : cuenta.tarifas_custom)
            : [];
          (tarifas || []).forEach(t => {
            if (t.nombre && !mergedCustom[t.nombre]) {
              mergedCustom[t.nombre] = { rec: 0, ent: 0, dev: 0 };
            }
          });
        } catch(e) {}

        setRendicionData({
          rec_cte: activity.rendicion.rec_cte || 0,
          ent_cte: activity.rendicion.ent_cte || 0,
          dev_cte: activity.rendicion.dev_cte || 0,
          rec_ext: activity.rendicion.rec_ext || 0,
          ent_ext: activity.rendicion.ent_ext || 0,
          dev_ext: activity.rendicion.dev_ext || 0,
          rec_cod: activity.rendicion.rec_cod || 0,
          ent_cod: activity.rendicion.ent_cod || 0,
          dev_cod: activity.rendicion.dev_cod || 0,
          rec_pxp: activity.rendicion.rec_pxp || 0,
          ent_pxp: activity.rendicion.ent_pxp || 0,
          dev_pxp: activity.rendicion.dev_pxp || 0,
          kpi_logrado: activity.rendicion.kpi_logrado || false,
          datos_custom: mergedCustom
        });
      } else {
        // Seed custom fields from cuenta.tarifas_custom if available
        const customKeys = {};
        try {
          const tarifas = cuenta?.tarifas_custom
            ? (typeof cuenta.tarifas_custom === 'string' ? JSON.parse(cuenta.tarifas_custom) : cuenta.tarifas_custom)
            : [];
          (tarifas || []).forEach(t => {
            if (t.nombre) customKeys[t.nombre] = { rec: 0, ent: 0, dev: 0 };
          });
        } catch(e) {}
        setRendicionData({
          rec_cte: 0, ent_cte: 0, dev_cte: 0, rec_ext: 0, ent_ext: 0, dev_ext: 0,
          rec_cod: 0, ent_cod: 0, dev_cod: 0, rec_pxp: 0, ent_pxp: 0, dev_pxp: 0,
          kpi_logrado: false, datos_custom: customKeys
        });
      }

      if (activity.precision) {
        setPrecisionData({
          total_ofs: activity.precision.total_ofs || 0,
          matches_directos: activity.precision.matches_directos || 0,
          sugerencias_aceptadas: activity.precision.sugerencias_aceptadas || 0,
          sugerencias_rechazadas: activity.precision.sugerencias_rechazadas || 0,
          contactos_manuales: activity.precision.contactos_manuales || 0,
          precision_percent: activity.precision.precision_percent || 0,
          detalles: activity.precision.detalles
        });
      } else {
        setPrecisionData({
          total_ofs: 0, matches_directos: 0, sugerencias_aceptadas: 0,
          sugerencias_rechazadas: 0, contactos_manuales: 0, precision_percent: 0,
          detalles: null
        });
      }
      
      setError(null);
      setActiveTab('rendicion');
    }
  }, [isOpen, activity]);

  // Recalculate precision when related fields change
  useEffect(() => {
    if (precisionData.total_ofs > 0) {
      const calculated = ((Number(precisionData.matches_directos) + Number(precisionData.sugerencias_aceptadas)) / Number(precisionData.total_ofs)) * 100;
      setPrecisionData(prev => ({ ...prev, precision_percent: Number(calculated.toFixed(2)) }));
    } else {
      setPrecisionData(prev => ({ ...prev, precision_percent: 0 }));
    }
  }, [precisionData.total_ofs, precisionData.matches_directos, precisionData.sugerencias_aceptadas]);

  const handleRendicionChange = (field, value) => {
    setRendicionData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomDataChange = (key, field, value) => {
    setRendicionData(prev => ({
      ...prev,
      datos_custom: {
        ...prev.datos_custom,
        [key]: {
          ...(prev.datos_custom[key] || {}),
          [field]: value
        }
      }
    }));
  };

  const handlePrecisionChange = (field, value) => {
    setPrecisionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [];

      // Update or Insert rendicion
      if (activity.rendicion && activity.rendicion.id) {
        const payload = {
          fecha,
          ...rendicionData,
          datos_custom: rendicionData.datos_custom
        };
        promises.push(supabase.from('rendiciones_diarias').update(payload).eq('id', activity.rendicion.id));
      } else {
        // Insert new
        const payload = {
          auth_id: user.id,
          fecha,
          ...rendicionData,
          datos_custom: rendicionData.datos_custom,
          created_at: new Date().toISOString()
        };
        promises.push(supabase.from('rendiciones_diarias').insert(payload));
      }

      // Update or Insert precision
      let newDetalles = precisionData.detalles;
      if (newDetalles) {
        try {
          const parsed = typeof newDetalles === 'string' ? JSON.parse(newDetalles) : newDetalles;
          parsed.precision_total_percent = precisionData.precision_percent;
          parsed.total_ofs_trackeado = precisionData.total_ofs;
          parsed.matches_totales = Number(precisionData.matches_directos) + Number(precisionData.sugerencias_aceptadas);
          parsed.matches_manuales = Number(precisionData.contactos_manuales);
          newDetalles = typeof precisionData.detalles === 'string' ? JSON.stringify(parsed) : parsed;
        } catch(e) {
          console.error("Error parsing detalles JSON", e);
        }
      }

      const precisionPayload = {
        fecha,
        total_ofs: precisionData.total_ofs,
        matches_directos: precisionData.matches_directos,
        sugerencias_aceptadas: precisionData.sugerencias_aceptadas,
        sugerencias_rechazadas: precisionData.sugerencias_rechazadas,
        contactos_manuales: precisionData.contactos_manuales,
        precision_percent: precisionData.precision_percent,
        detalles: newDetalles
      };

      if (activity.precision && activity.precision.id) {
        promises.push(supabase.from('reportes_precision').update(precisionPayload).eq('id', activity.precision.id));
      } else {
        promises.push(supabase.from('reportes_precision').insert({
          ...precisionPayload,
          user_id: user.id,
          region: "Desconocida", // Or infer from user
          created_at: new Date().toISOString()
        }));
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }

      onSave(); // Trigger parent reload
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.4rem',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    backgroundColor: isDark ? '#2A2A2A' : '#FFF',
    color: theme.text,
    fontSize: '0.9rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: isDark ? '#AAA' : '#666',
    marginBottom: '0.3rem'
  };

  const sectionStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    padding: '0.8rem',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9F9F9',
    borderRadius: '10px',
    marginBottom: '0.5rem'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: theme.sidebar,
        borderRadius: '20px',
        width: '100%', maxWidth: '600px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: `1px solid ${theme.border}`
      }}>
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Editar Actividad</h2>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.85rem', color: theme.accent }}>{(() => {
              const [y, m, d] = (activity?.fecha || '').split('T')[0].split('-');
              if (!y || !m || !d) return activity?.fecha;
              return new Date(y, m - 1, d).toLocaleDateString();
            })()}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: '0.2rem' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs & Date */}
        <div style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('rendicion')}
              style={{
                background: 'none', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9rem', borderRadius: '8px',
                backgroundColor: activeTab === 'rendicion' ? (isDark ? 'rgba(255,255,255,0.1)' : '#E0E0E0') : 'transparent',
                color: activeTab === 'rendicion' ? theme.text : (isDark ? '#777' : '#999')
              }}
            >
              Rendición Diaria {!activity?.rendicion && <span style={{ color: '#FF9500' }}>⚠️</span>}
            </button>
            <button
              onClick={() => setActiveTab('precision')}
              style={{
                background: 'none', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9rem', borderRadius: '8px',
                backgroundColor: activeTab === 'precision' ? (isDark ? 'rgba(255,255,255,0.1)' : '#E0E0E0') : 'transparent',
                color: activeTab === 'precision' ? theme.text : (isDark ? '#777' : '#999')
              }}
            >
              Reporte Precisión {!activity?.precision && <span style={{ color: '#FF9500' }}>⚠️</span>}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="fecha_input" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Fecha:</label>
            <input 
              id="fecha_input"
              name="fecha"
              type="date" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)} 
              style={{...inputStyle, width: 'auto'}} 
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Discrepancy warning between precision total_ofs and rendicion received total */}
          {(() => {
            const rendTotalRec = (rendicionData.rec_cte||0) + (rendicionData.rec_ext||0) + (rendicionData.rec_cod||0) + (rendicionData.rec_pxp||0) +
              Object.values(rendicionData.datos_custom || {}).reduce((s, v) => s + (v.rec||0), 0);
            const precTotal = precisionData.total_ofs || 0;
            const hasBoth = activity?.rendicion && activity?.precision;
            if (hasBoth && precTotal > 0 && rendTotalRec > 0 && precTotal !== rendTotalRec) {
              return (
                <div style={{ backgroundColor: 'rgba(255, 59, 48, 0.08)', color: '#FF3B30', padding: '0.8rem', borderRadius: '10px', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  Discrepancia: Rendición recibió {rendTotalRec} paquetes, Precisión reporta {precTotal} OFs.
                </div>
              );
            }
            return null;
          })()}

          {activeTab === 'rendicion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {!activity?.rendicion && (
                <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', padding: '0.8rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ No existe rendición para esta fecha. Los datos ingresados crearán un nuevo registro.
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <label htmlFor="kpi_logrado_input" style={{ fontSize: '0.9rem', fontWeight: 700 }}>KPI Logrado (Día):</label>
                     <input 
                       id="kpi_logrado_input"
                       name="kpi_logrado"
                       type="checkbox" 
                       checked={rendicionData.kpi_logrado}
                       onChange={e => handleRendicionChange('kpi_logrado', e.target.checked)}
                       style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                     />
              </div>
              <div style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '1rem', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 800 }}>TIPO OF</th>
                      <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 800 }}>RECIBIDOS</th>
                      <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 800 }}>ENTREGADOS</th>
                      <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 800 }}>DEVUELTOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['cte', 'ext', 'cod', 'pxp'].map((tipo) => (
                      <tr key={tipo} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>{tipo.toUpperCase()}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`rec_${tipo}`} name={`rec_${tipo}`} type="number" value={rendicionData[`rec_${tipo}`]} onChange={e => handleRendicionChange(`rec_${tipo}`, parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Recibidos ${tipo}`} />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`ent_${tipo}`} name={`ent_${tipo}`} type="number" value={rendicionData[`ent_${tipo}`]} onChange={e => handleRendicionChange(`ent_${tipo}`, parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Entregados ${tipo}`} />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`dev_${tipo}`} name={`dev_${tipo}`} type="number" value={rendicionData[`dev_${tipo}`]} onChange={e => handleRendicionChange(`dev_${tipo}`, parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Devueltos ${tipo}`} />
                        </td>
                      </tr>
                    ))}
                    {/* Campos Custom */}
                    {Object.keys(rendicionData.datos_custom || {}).map(key => (
                      <tr key={key} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>{key.toUpperCase()}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`rec_custom_${key}`} name={`rec_custom_${key}`} type="number" value={rendicionData.datos_custom[key].rec || 0} onChange={e => handleCustomDataChange(key, 'rec', parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Recibidos ${key}`} />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`ent_custom_${key}`} name={`ent_custom_${key}`} type="number" value={rendicionData.datos_custom[key].ent || 0} onChange={e => handleCustomDataChange(key, 'ent', parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Entregados ${key}`} />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input id={`dev_custom_${key}`} name={`dev_custom_${key}`} type="number" value={rendicionData.datos_custom[key].dev || 0} onChange={e => handleCustomDataChange(key, 'dev', parseInt(e.target.value)||0)} style={inputStyle} aria-label={`Devueltos ${key}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'precision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {!activity?.precision && (
                <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', padding: '0.8rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ No existe reporte de precisión para esta fecha. Los datos ingresados crearán un nuevo registro.
                </div>
              )}
                  
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(52, 199, 89, 0.1)' : '#E8F8EE', padding: '0.8rem 1rem', borderRadius: '10px', border: `1px solid rgba(52, 199, 89, 0.3)` }}>
                     <div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#AAA' : '#666', fontWeight: 700 }}>Precisión Calculada</p>
                        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#34C759' }}>{precisionData.precision_percent}%</p>
                     </div>
                     <div style={{ textAlign: 'right', fontSize: '0.75rem', color: isDark ? '#888' : '#666' }}>
                        Fórmula: <br/> (Matches Directos + Aceptadas) / Total OFs
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                    <div>
                      <label htmlFor="total_ofs" style={labelStyle}>Total OFs</label>
                      <input id="total_ofs" name="total_ofs" type="number" value={precisionData.total_ofs} onChange={e => handlePrecisionChange('total_ofs', parseInt(e.target.value)||0)} style={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="matches_directos" style={labelStyle}>Matches Directos</label>
                      <input id="matches_directos" name="matches_directos" type="number" value={precisionData.matches_directos} onChange={e => handlePrecisionChange('matches_directos', parseInt(e.target.value)||0)} style={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="sugerencias_aceptadas" style={labelStyle}>Sugerencias Aceptadas</label>
                      <input id="sugerencias_aceptadas" name="sugerencias_aceptadas" type="number" value={precisionData.sugerencias_aceptadas} onChange={e => handlePrecisionChange('sugerencias_aceptadas', parseInt(e.target.value)||0)} style={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="sugerencias_rechazadas" style={labelStyle}>Sugerencias Rechazadas</label>
                      <input id="sugerencias_rechazadas" name="sugerencias_rechazadas" type="number" value={precisionData.sugerencias_rechazadas} onChange={e => handlePrecisionChange('sugerencias_rechazadas', parseInt(e.target.value)||0)} style={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="contactos_manuales" style={labelStyle}>Contactos Manuales</label>
                      <input id="contactos_manuales" name="contactos_manuales" type="number" value={precisionData.contactos_manuales} onChange={e => handlePrecisionChange('contactos_manuales', parseInt(e.target.value)||0)} style={inputStyle} />
                    </div>
                  </div>
              </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
          <button 
            onClick={onClose}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: theme.text, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{  
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', 
              backgroundColor: theme.accent, color: '#FFF', fontWeight: 700, 
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 
            }}
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
