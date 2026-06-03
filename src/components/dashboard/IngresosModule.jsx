import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { 
  DollarSign, 
  TrendingUp
} from 'lucide-react';

export default function IngresosModule({ dateRange, externalRendiciones }) {
  const { user } = useAuth();
  const [data, setData] = useState({
    cuenta: null,
    rendiciones: externalRendiciones || [],
    loading: !externalRendiciones
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      // Si ya tenemos las rendiciones desde el padre, solo buscamos la cuenta
      try {
        const { data: cuentaData, error: cuentaError } = await supabase
          .from('cuenta')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        if (cuentaError && cuentaError.code !== 'PGRST116') throw cuentaError;

        const aggregateRendicionesByFecha = rows => {
          const map = new Map();
          rows.forEach(r => {
            if (!r || !r.fecha) return;
            const key = r.fecha;
            const existing = map.get(key) || {
              fecha: key,
              rec_cte: 0,
              ent_cte: 0,
              dev_cte: 0,
              rec_ext: 0,
              ent_ext: 0,
              dev_ext: 0,
              rec_cod: 0,
              ent_cod: 0,
              dev_cod: 0,
              rec_pxp: 0,
              ent_pxp: 0,
              dev_pxp: 0,
              datos_custom: {},
              _total_rec: 0,
              _total_ent: 0,
            };

            existing.rec_cte += (r.rec_cte || 0);
            existing.ent_cte += (r.ent_cte || 0);
            existing.dev_cte += (r.dev_cte || 0);
            existing.rec_ext += (r.rec_ext || 0);
            existing.ent_ext += (r.ent_ext || 0);
            existing.dev_ext += (r.dev_ext || 0);
            existing.rec_cod += (r.rec_cod || 0);
            existing.ent_cod += (r.ent_cod || 0);
            existing.dev_cod += (r.dev_cod || 0);
            existing.rec_pxp += (r.rec_pxp || 0);
            existing.ent_pxp += (r.ent_pxp || 0);
            existing.dev_pxp += (r.dev_pxp || 0);

            const datosCustom =
              typeof r.datos_custom === "string"
                ? JSON.parse(r.datos_custom || "{}")
                : r.datos_custom;

            if (datosCustom && typeof datosCustom === "object") {
              Object.keys(datosCustom).forEach(customKey => {
                const item = datosCustom[customKey] || {};
                if (!existing.datos_custom[customKey]) {
                  existing.datos_custom[customKey] = { rec: 0, ent: 0, dev: 0 };
                }
                existing.datos_custom[customKey].rec += (item.rec || 0);
                existing.datos_custom[customKey].ent += (item.ent || 0);
                existing.datos_custom[customKey].dev += (item.dev || 0);
              });
            }

            existing._total_rec +=
              (r.rec_cte || 0) +
              (r.rec_ext || 0) +
              (r.rec_cod || 0) +
              (r.rec_pxp || 0);
            existing._total_ent +=
              (r.ent_cte || 0) +
              (r.ent_ext || 0) +
              (r.ent_cod || 0) +
              (r.ent_pxp || 0);

            map.set(key, existing);
          });

          return Array.from(map.values())
            .map(item => {
              const totalRec = item._total_rec || 0;
              const totalEnt = item._total_ent || 0;
              const kpiActual = totalRec > 0 ? (totalEnt / totalRec) * 100 : 0;
              return {
                ...item,
                kpi_logrado: kpiActual >= 95,
              };
            })
            .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        };

        let rendData = externalRendiciones;
        if (!rendData) {
          const { data: fetchedRend, error: rendError } = await supabase
            .from('rendiciones_diarias')
            .select('*')
            .eq('auth_id', user.id)
            .gte('fecha', dateRange.from)
            .lte('fecha', dateRange.to)
            .order('fecha', { ascending: false });
          if (rendError) throw rendError;
          rendData = fetchedRend;
        }

        setData({
          cuenta: cuentaData,
          rendiciones: aggregateRendicionesByFecha(rendData || []),
          loading: false
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [user, dateRange, externalRendiciones]);

  // Cálculos de Ingresos
  const calculateEarnings = () => {
    if (!data.cuenta || data.rendiciones.length === 0) return 0;
    
    const { rendiciones } = data;
    let total = 0;

    rendiciones.forEach(r => {
      // Determinamos si este día el KPI fue logrado (o fallback a lo que diga la cuenta globalmente)
      const kpiLogrado = r.kpi_logrado !== undefined ? r.kpi_logrado : (data.cuenta.kpi >= 95);

      // 1. Ingresos Standard (Basados en KPI)
      // Si se logró el KPI, usamos la tarifa de incentivo (kpi_xxx), si no la base (pago_xxx)
      total += (r.ent_cte || 0) * (kpiLogrado ? (data.cuenta.kpi_cte || 0) : (data.cuenta.pago_nacional || 0));
      total += (r.ent_ext || 0) * (kpiLogrado ? (data.cuenta.kpi_ext || 0) : (data.cuenta.pago_extranjero || 0));
      total += (r.ent_cod || 0) * (kpiLogrado ? (data.cuenta.kpi_cod || 0) : (data.cuenta.pago_cod || 0));
      total += (r.ent_pxp || 0) * (kpiLogrado ? (data.cuenta.kpi_pxp || 0) : (data.cuenta.pago_pxp || 0));

      // 2. Custom Tariffs logic
      if (r.datos_custom && typeof r.datos_custom === 'object') {
        Object.keys(r.datos_custom).forEach(key => {
          const stats = r.datos_custom[key]; // { rec, ent, dev }
          const config = data.cuenta.tarifas_custom?.find(t => t.nombre === key || t.label === key);
          
          if (config && stats.ent > 0) {
            // Si depende del KPI y se logró, usamos con_kpi, si no base
            const price = (config.depende_kpi && kpiLogrado) ? (config.con_kpi || 0) : (config.base || 0);
            total += stats.ent * price;
          }
        });
      }
    });

    return total;
  };

  const totalIngresos = calculateEarnings();
  const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  if (data.loading) return <div className="p-10 text-center text-gray-400">Cargando datos...</div>;

  return (
    <div className="space-y-4">
      {/* Grid Principal */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* KPI de Gestión */}
        <div className="bg-[#FBFF00] p-4 rounded-[18px] shadow-sm flex flex-row md:flex-col justify-between md:justify-center items-center text-black border border-black/5 shrink-0 min-w-full md:min-w-[100px] md:h-auto">
          <p className="text-[10px] md:text-[8px] font-black uppercase tracking-tighter opacity-70">KPI Gestión</p>
          <div className="flex items-baseline">
            <span className="text-4xl md:text-3xl font-black leading-none">{data.cuenta?.kpi || '0'}</span>
            <span className="text-[13px] md:text-[11px] font-bold">%</span>
          </div>
        </div>

        {/* Tarifas y Precios */}
        <div className="flex-1 bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0">Tarifario de Servicios (Base / Con KPI)</p>
            {Number(data.cuenta?.piso) > 0 && (
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase tracking-widest w-fit">
                Base Diaria: {formatCurrency(data.cuenta?.piso)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <TarifaItem 
              label="CTE" 
              value={`${formatCurrency(data.cuenta?.pago_nacional || 0)} / ${formatCurrency(data.cuenta?.kpi_cte || 0)}`} 
              highlight 
            />
            <TarifaItem 
              label="EXT" 
              value={`${formatCurrency(data.cuenta?.pago_extranjero || 0)} / ${formatCurrency(data.cuenta?.kpi_ext || 0)}`} 
              highlight 
            />
            <TarifaItem 
              label="COD" 
              value={`${formatCurrency(data.cuenta?.pago_cod || 0)} / ${formatCurrency(data.cuenta?.kpi_cod || 0)}`} 
              highlight 
            />
            <TarifaItem 
              label="PXP" 
              value={`${formatCurrency(data.cuenta?.pago_pxp || 0)} / ${formatCurrency(data.cuenta?.kpi_pxp || 0)}`} 
              highlight 
            />
            {data.cuenta?.tarifas_custom?.map((t, i) => (
              <TarifaItem 
                key={i}
                label={t.label || t.nombre} 
                value={t.depende_kpi ? `${formatCurrency(t.base || 0)} / ${formatCurrency(t.con_kpi || 0)}` : formatCurrency(t.base || 0)} 
                highlight={t.depende_kpi}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recaudación Proyectada Real */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Recaudación Final Acumulada</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-3xl font-black text-gray-900">{formatCurrency(totalIngresos)}</span>
            <span className="text-green-500 text-[10px] font-bold flex items-center gap-1">
              <TrendingUp size={10}/> Real
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-1 italic">Calculado sobre {data.rendiciones.length} rendiciones diarias</p>
        </div>
        <div className="h-14 w-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 self-end md:self-center">
          <DollarSign size={24} className="text-[#FBFF00]" />
        </div>
      </div>
    </div>
  );
}

function TarifaItem({ label, value, highlight }) {
  return (
    <div className={`px-4 py-2 rounded-xl border flex items-center justify-between gap-4 ${highlight ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-[9px] font-black text-gray-500 uppercase truncate max-w-[100px]">{label}</p>
      <p className={`text-sm font-black whitespace-nowrap ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
