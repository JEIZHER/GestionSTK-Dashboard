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

export default function IngresosModule({ dateRange }) {
  const { user } = useAuth();
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuenta = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cuenta')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        setCuenta(data);
      } catch (err) {
        console.error('Error fetching cuenta:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCuenta();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-gray-400">Cargando tarifas...</div>;

  return (
    <div className="space-y-4">
      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI de Gestión */}
        <div className="bg-[#FBFF00] p-5 rounded-[20px] shadow-sm flex flex-col justify-center items-center text-black border border-black/5">
          <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 mb-1">KPI Objetivo</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{cuenta?.kpi || '0'}</span>
            <span className="text-sm font-bold">%</span>
          </div>
        </div>

        {/* Tarifas Base */}
        <div className="col-span-3 bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tarifario Base Nacional / EXT</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TarifaItem label="NORMAL (BASE)" value={`$${cuenta?.pago_nacional || '0'}`} />
            <TarifaItem label="NORMAL (KPI)" value={`$${cuenta?.kpi_cte || '0'}`} highlight />
            <TarifaItem label="EXT (BASE)" value={`$${cuenta?.pago_extranjero || '0'}`} />
            <TarifaItem label="EXT (KPI)" value={`$${cuenta?.kpi_ext || '0'}`} highlight />
          </div>
        </div>
      </div>

      {/* Tipos de Pago Personalizados */}
      {cuenta?.tarifas_custom?.length > 0 && (
        <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Cargos Adicionales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {cuenta.tarifas_custom.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-blue-600">
                  <Briefcase size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t.nombre}</p>
                  <p className="text-sm font-black text-gray-900">${t.base} <span className="text-[9px] text-gray-400">/ ${t.con_kpi}</span></p>
                </div>
                {t.depende_kpi && (
                  <div className="ml-auto bg-amber-100 text-amber-700 p-1 rounded-md" title="Depende de KPI">
                    <Target size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recaudación Proyectada (Placeholder) */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recaudación Final Estimada</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">$1.856.162</span>
            <span className="text-green-500 text-[10px] font-bold flex items-center gap-1">
              <TrendingUp size={10}/> +4.2%
            </span>
          </div>
        </div>
        <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center">
          <DollarSign size={20} className="text-[#FBFF00]" />
        </div>
      </div>
    </div>
  );
}

function TarifaItem({ label, value, highlight }) {
  return (
    <div className={`p-3 rounded-[14px] border ${highlight ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{label}</p>
      <p className={`text-sm font-black ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
