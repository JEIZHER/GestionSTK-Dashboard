import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Package, 
  Briefcase
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
          rendiciones: rendData || [],
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
    
    const { cuenta, rendiciones } = data;
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
          const config = data.cuenta.tarifas_custom?.find(t => t.nombre === key);
          
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
      <div className="flex gap-4">
        {/* KPI de Gestión */}
        <div className="w-[85px] bg-[#FBFF00] p-2 rounded-[18px] shadow-sm flex flex-col justify-center items-center text-black border border-black/5 shrink-0">
          <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">KPI</p>
          <div className="flex items-baseline">
            <span className="text-3xl font-black leading-none">{data.cuenta?.kpi || '0'}</span>
            <span className="text-[11px] font-bold">%</span>
          </div>
        </div>

        {/* Tarifas y Precios */}
        <div className="flex-1 bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tarifario de Servicios (Base / Con KPI)</p>
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
                label={t.nombre} 
                value={t.depende_kpi ? `${formatCurrency(t.base || 0)} / ${formatCurrency(t.con_kpi || 0)}` : formatCurrency(t.base || 0)} 
                highlight={t.depende_kpi}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recaudación Proyectada Real */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-blue-600">Recaudación Final Acumulada</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatCurrency(totalIngresos)}</span>
            <span className="text-green-500 text-[10px] font-bold flex items-center gap-1">
              <TrendingUp size={10}/> Real
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-1 italic">Calculado sobre {data.rendiciones.length} rendiciones diarias</p>
        </div>
        <div className="h-14 w-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
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
