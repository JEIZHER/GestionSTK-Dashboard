import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import logo from "../../assets/logo.png";
import IngresosModule from './IngresosModule';
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  RefreshCcw,
  PackageCheck,
  ClipboardList,
  Wallet,
  BarChart3,
  CalendarDays,
  ArrowRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function DashboardHome() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalSectores: 0,
    totalContactos: 0,
    promedioPrecision: 0,
    rendiciones: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [visibleCurves, setVisibleCurves] = useState(['total']);

  // Colores para las curvas
  const curveColors = {
    total: theme.primary,
    cte: "#8E8E93",
    ext: theme.accent,
    cod: "#007AFF",
    pxp: "#5856D6",
    custom: theme.primary // Fallback para custom
  };

  // Vistas de gráficos
  const [chartViewRec, setChartViewRec] = useState("total");
  const [chartViewEnt, setChartViewEnt] = useState("total");
  const [chartViewIng, setChartViewIng] = useState("total");

  // Estados para filtros de Recepción
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Función para calcular días hábiles (Lunes a Sábado) en el rango seleccionado
  const calculateWorkDaysInPeriod = (from, to) => {
    let count = 0;
    const current = new Date(from);
    const end = new Date(to);
    
    while (current <= end) {
      if (current.getDay() !== 0) { // 0 es Domingo
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const workDaysInPeriod = calculateWorkDaysInPeriod(dateRange.from, dateRange.to);

  const parseTarifasCustom = value => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value || "[]");
      } catch {
        return [];
      }
    }
    return [];
  };

  const getCustomLabel = key => {
    const tarifas = parseTarifasCustom(cuenta?.tarifas_custom);
    const match = tarifas.find(t => t.nombre === key || t.label === key);
    return match?.label || match?.nombre || key;
  };

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

  // Cálculos consolidados desde rendiciones
  const totals = stats.rendiciones.reduce((acc, curr) => {
    acc.rec_normal += (curr.rec_cte || 0);
    acc.rec_ext += (curr.rec_ext || 0);
    acc.rec_cod += (curr.rec_cod || 0);
    acc.rec_pxp += (curr.rec_pxp || 0);
    
    acc.ent_normal += (curr.ent_cte || 0);
    acc.ent_ext += (curr.ent_ext || 0);
    acc.ent_cod += (curr.ent_cod || 0);
    acc.ent_pxp += (curr.ent_pxp || 0);
    
    acc.dev_normal += (curr.dev_cte || 0);
    acc.dev_ext += (curr.dev_ext || 0);
    
    // Sumar custom bultos
    if (curr.datos_custom) {
      Object.keys(curr.datos_custom).forEach(key => {
        const item = curr.datos_custom[key];
        acc.rec_custom += (item.rec || 0);
        acc.ent_custom += (item.ent || 0);
        
        // Agregar desglose por nombre de tarifa
        if (!acc.detail_custom[key]) {
          acc.detail_custom[key] = { rec: 0, ent: 0 };
        }
        acc.detail_custom[key].rec += (item.rec || 0);
        acc.detail_custom[key].ent += (item.ent || 0);
      });
    }
    return acc;
  }, { 
    rec_normal: 0, rec_ext: 0, rec_cod: 0, rec_pxp: 0, rec_custom: 0,
    ent_normal: 0, ent_ext: 0, ent_cod: 0, ent_pxp: 0, ent_custom: 0,
    dev_normal: 0, dev_ext: 0,
    detail_custom: {} 
  });

  const chartData = stats.rendiciones.length > 0 
    ? stats.rendiciones.map(r => {
        let recCustom = 0; let entCustom = 0; let ingCustom = 0;
        const kpiLogrado = r.kpi_logrado !== undefined ? r.kpi_logrado : true;
        const customBreakdown = {};

        if (r.datos_custom && typeof r.datos_custom === "object") {
          Object.keys(r.datos_custom).forEach(key => {
            const item = r.datos_custom[key];
            const label = getCustomLabel(key);
            recCustom += (item.rec || 0);
            entCustom += (item.ent || 0);

            const config = parseTarifasCustom(cuenta?.tarifas_custom)?.find(t => t.nombre === key || t.label === key);
            let itemIng = 0;
            if (config && item.ent > 0) {
              const price = (config.depende_kpi && kpiLogrado) ? (config.con_kpi || 0) : (config.base || 0);
              itemIng = item.ent * price;
              ingCustom += itemIng;
            }

            customBreakdown[`rec_${label}`] = (item.rec || 0);
            customBreakdown[`ent_${label}`] = (item.ent || 0);
            customBreakdown[`ing_${label}`] = itemIng;
          });
        }
        
        const c_kpiCte = cuenta?.kpi_cte || 0; const c_cte = cuenta?.pago_nacional || 0;
        const c_kpiExt = cuenta?.kpi_ext || 0; const c_ext = cuenta?.pago_extranjero || 0;
        const c_kpiCod = cuenta?.kpi_cod || 0; const c_cod = cuenta?.pago_cod || 0;
        const c_kpiPxp = cuenta?.kpi_pxp || 0; const c_pxp = cuenta?.pago_pxp || 0;

        const ingCte = (r.ent_cte || 0) * (kpiLogrado ? c_kpiCte : c_cte);
        const ingExt = (r.ent_ext || 0) * (kpiLogrado ? c_kpiExt : c_ext);
        const ingCod = (r.ent_cod || 0) * (kpiLogrado ? c_kpiCod : c_cod);
        const ingPxp = (r.ent_pxp || 0) * (kpiLogrado ? c_kpiPxp : c_pxp);

        return {
          name: new Date(r.fecha).toLocaleDateString('es-CL', { weekday: 'short' }),
          
          rec_total: (r.rec_cte||0) + (r.rec_ext||0) + (r.rec_cod||0) + (r.rec_pxp||0) + recCustom,
          rec_cte: r.rec_cte || 0,
          rec_ext: r.rec_ext || 0,
          rec_cod: r.rec_cod || 0,
          rec_pxp: r.rec_pxp || 0,
          rec_custom: recCustom,

          ent_total: (r.ent_cte||0) + (r.ent_ext||0) + (r.ent_cod||0) + (r.ent_pxp||0) + entCustom,
          ent_cte: r.ent_cte || 0,
          ent_ext: r.ent_ext || 0,
          ent_cod: r.ent_cod || 0,
          ent_pxp: r.ent_pxp || 0,
          ent_custom: entCustom,

          ing_total: ingCte + ingExt + ingCod + ingPxp + ingCustom,
          ing_cte: ingCte,
          ing_ext: ingExt,
          ing_cod: ingCod,
          ing_pxp: ingPxp,
          ing_custom: ingCustom,
          
          ...customBreakdown
        }
      })
    : [
        { name: 'Sin Datos', rec_total: 0, ent_total: 0, ing_total: 0 }
      ];

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("nombre, region_asignada, fecha_registro")
          .eq("auth_id", user.id)
          .single();
        
        if (profileError) throw profileError;
        
        const cleanRegion = profileData.region_asignada?.replace(/[\r\n\t]/g, "").trim();
        const cleanProfile = { ...profileData, region_asignada: cleanRegion };
        setProfile(cleanProfile);

        const { data: cuentaData, error: cuentaError } = await supabase
          .from("cuenta")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (cuentaError && cuentaError.code !== "PGRST116") throw cuentaError;
        setCuenta(cuentaData || null);

        // 2. Fetch Count Sectores
        const { count: sectoresCount } = await supabase
          .from("sectores")
          .select("*", { count: "exact", head: true })
          .eq("region_asignada", cleanRegion);

        // 3. Fetch Count Contactos
        const { count: contactosCount } = await supabase
          .from("contactos")
          .select("*", { count: "exact", head: true })
          .eq("region_asignada", cleanRegion);

        // 4. Fetch Precision Average
        const { data: precisionData } = await supabase
          .from("reportes_precision")
          .select("precision_percent");
        
        const avg = precisionData?.length > 0 
          ? (precisionData.reduce((acc, curr) => acc + (curr.precision_percent || 0), 0) / precisionData.length).toFixed(1)
          : 0;

        // 5. Fetch Rendiciones Diarias (para conteos reales)
        const { data: rendData, error: rendError } = await supabase
          .from("rendiciones_diarias")
          .select("*")
          .eq("auth_id", user.id)
          .gte("fecha", dateRange.from)
          .lte("fecha", dateRange.to)
          .order("fecha", { ascending: true });

        if (rendError) throw rendError;

        setStats({
          totalSectores: sectoresCount || 0,
          totalContactos: contactosCount || 0,
          promedioPrecision: avg,
          rendiciones: aggregateRendicionesByFecha(rendData || [])
        });

      } catch (err) {
        console.error("Error al cargar datos dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, dateRange.from, dateRange.to]); // Se dispara cuando cambian las fechas o el usuario

  if (loading) return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: theme.background, 
      color: theme.text,
      fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
         <div style={{ 
           width: "40px", 
           height: "40px", 
           border: `3px solid ${theme.border}`, 
           borderTopColor: theme.accent, 
           borderRadius: "50%",
           animation: "spin 1s linear infinite",
           margin: "0 auto 1rem"
         }} />
         <p style={{ fontWeight: "600", fontSize: "0.875rem" }}>Cargando ecosistema...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: theme.background, 
      color: theme.text, 
      display: "flex",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      transition: "background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
    }}>
      <aside style={{ 
        width: isSidebarOpen ? "280px" : "0px", 
        backgroundColor: theme.sidebar, 
        borderRight: isSidebarOpen ? `1px solid ${theme.border}` : "none",
        display: "flex",
        flexDirection: "column",
        padding: isSidebarOpen ? "1.5rem" : "0",
        position: "sticky",
        top: 0,
        height: "100vh",
        boxShadow: isDark ? "none" : "4px 0 24px rgba(0,0,0,0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 100
      }}>
        <div style={{ flex: 1, opacity: isSidebarOpen ? 1 : 0, transition: "opacity 0.2s", minWidth: "240px" }}>
          <div style={{ marginBottom: "2.5rem", padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img 
              src={logo} 
              alt="GestionSTK Logo" 
              style={{ 
                width: "32px", 
                height: "32px", 
                objectFit: "contain" 
              }} 
            />
            <h1 style={{ 
              fontSize: "1.15rem", 
              fontWeight: 800, 
              color: theme.text,
              letterSpacing: "-0.03em",
              margin: 0
            }}>
              GestionSTK <span style={{ opacity: 0.5, fontSize: "0.7rem", verticalAlign: "top", marginLeft: "2px" }}>WEB</span>
            </h1>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <SidebarItem 
              icon={<LayoutDashboard size={19} />} 
              label="Dashboard" 
              active={activeTab === "inventory"} 
              onClick={() => setActiveTab("inventory")}
              theme={theme}
            />
            <SidebarItem 
              icon={<PackageCheck size={19} />} 
              label="RECEPCIÓN" 
              active={activeTab === "recepcion"} 
              onClick={() => setActiveTab("recepcion")}
              theme={theme}
            />
            <SidebarItem 
              icon={<ClipboardList size={19} />} 
              label="RENDICIÓN" 
              active={activeTab === "rendicion"} 
              onClick={() => setActiveTab("rendicion")}
              theme={theme}
            />
            <SidebarItem 
              icon={<Wallet size={19} />} 
              label="INGRESOS" 
              active={activeTab === "ingresos"} 
              onClick={() => setActiveTab("ingresos")}
              theme={theme}
            />
            <SidebarItem 
              icon={<BarChart3 size={19} />} 
              label="ESTADÍSTICAS" 
              active={activeTab === "estadisticas"} 
              onClick={() => setActiveTab("estadisticas")}
              theme={theme}
            />
            <SidebarItem 
              icon={<Settings size={19} />} 
              label="Vincular Settings" 
              active={activeTab === "settings"} 
              onClick={() => setActiveTab("settings")}
              theme={theme}
            />
          </nav>
        </div>

        <div style={{ 
          borderTop: `1px solid ${theme.border}`, 
          paddingTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              padding: "0.5rem",
              marginBottom: "0.5rem"
            }}>
              <div style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                backgroundColor: theme.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${theme.border}`
              }}>
                <User size={18} color={theme.accent} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {profile?.nombre || "Cargando..."}
                </p>
                <p style={{ margin: 0, fontSize: "0.7rem", color: isDark ? "#888" : "#666" }}>
                  {profile?.region_asignada || "Consultando región..."}
                </p>
              </div>
            </div>

            <button 
              onClick={toggleTheme}
              style={{ 
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.card,
                color: theme.text,
                cursor: "pointer",
                fontSize: "0.825rem",
                fontWeight: 600,
                transition: "all 0.2s ease"
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {isDark ? "Modo Claro" : "Modo Oscuro"}
            </button>

            <button 
              onClick={logout}
              style={{ 
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "transparent",
                color: "#DC3545",
                cursor: "pointer",
                fontSize: "0.825rem",
                fontWeight: 600,
                transition: "background 0.2s ease"
              }}
            >
              <LogOut size={15} /> Salir del Sistema
            </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", backgroundColor: isDark ? "#0A0A0A" : "#FAFAFA", position: "relative" }}>
        {/* Toggle Button Container */}
        <div style={{ 
          position: "sticky", 
          top: "1.5rem", 
          left: "1rem", 
          zIndex: 110,
          width: 0,
          height: 0
        }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: theme.sidebar,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "all 0.2s",
              position: "absolute",
              left: isSidebarOpen ? "-16px" : "0px"
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div style={{ 
          maxWidth: "1000px", 
          margin: "0 auto", 
          padding: "1.5rem 2rem 1.5rem 3.5rem",
          minHeight: "100%"
        }}>
          {activeTab === "inventory" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>
                  Resumen
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", marginTop: "0.5rem" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: theme.accent, fontSize: "0.85rem", fontWeight: 800 }}>
                      <User size={14} />
                      {profile?.nombre}
                   </div>
                   <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: theme.border }} />
                   <span style={{ fontSize: "0.85rem", fontWeight: 700, color: theme.text }}>{profile?.region_asignada}</span>
                   <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: theme.border }} />
                   <span style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666" }}>
                     Desde: {profile?.fecha_registro ? new Date(profile.fecha_registro).toLocaleDateString() : "N/A"}
                   </span>
                </div>
              </header>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  <StatCard label="Sectores" value={stats.totalSectores} color={theme.accent} theme={theme} />
                  <StatCard label="Contactos" value={stats.totalContactos} color={theme.primary} theme={theme} />
                  <StatCard label="OF Auto deteccion" value={`${stats.promedioPrecision}%`} color="#34C759" theme={theme} />
              </div>

              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "24px", 
                border: `1px solid ${theme.border}`,
                padding: "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)"
              }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Actividad Reciente</h3>
                    <button style={{ color: theme.accent, fontSize: "0.8rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Ver todo</button>
                 </div>
                 <div style={{ color: isDark ? "#555" : "#AAA", textAlign: "center", padding: "4rem 0" }}>
                    <img 
                      src={logo} 
                      alt="Empty" 
                      style={{ 
                        width: "48px", 
                        height: "48px", 
                        marginBottom: "1rem", 
                        opacity: 0.25,
                        filter: isDark ? "grayscale(1) brightness(2)" : "grayscale(1)"
                      }} 
                    />
                    <p style={{ fontSize: "0.9rem" }}>No hay movimientos registrados en la última hora</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "recepcion" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ 
                 marginBottom: "2rem", 
                 display: "flex", 
                 justifyContent: "space-between", 
                 alignItems: "flex-end",
                 flexWrap: "wrap",
                 gap: "1.5rem"
               }}>
                <div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Recepción de Carga</h2>
                  <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Total de paquetes recibidos</p>
                </div>

                {/* Filtro de Fechas */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.75rem", 
                    backgroundColor: theme.sidebar, 
                    padding: "0.6rem 1rem", 
                    borderRadius: "16px",
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    position: "relative",
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarDays size={16} color={theme.accent} />
                    <input 
                      type="date" 
                      value={dateRange.from}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.showPicker) e.target.showPicker();
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        setDateRange(prev => ({ ...prev, from: e.target.value }));
                      }}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: theme.text, 
                        fontSize: "0.8rem", 
                        fontWeight: 700,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                  <ArrowRight size={14} color="#888" />
                  <input 
                    type="date" 
                    value={dateRange.to}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.target.showPicker) e.target.showPicker();
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDateRange(prev => ({ ...prev, to: e.target.value }));
                    }}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: theme.text, 
                      fontSize: "0.8rem", 
                      fontWeight: 700, 
                      outline: "none",
                      cursor: "pointer"
                    }}
                  />
                </div>
              </header>

              {/* Resumen de Recepción (UI Compacta con Datos Reales) */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr 1fr", 
                gap: "1.25rem", 
                marginBottom: "2rem" 
              }}>
                <div style={{ 
                  backgroundColor: theme.sidebar, 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 2px 12px -5px rgba(0,0,0,0.03)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>DIAS EN RANGO (L-S)</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", justifyContent: "center" }}>
                    <span style={{ fontSize: "1.75rem", fontWeight: 900, color: theme.text }}>{workDaysInPeriod}</span>
                    <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 700 }}>HÁBILES</span>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: theme.sidebar, 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 2px 12px -5px rgba(0,0,0,0.03)",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Recibidos por tipo de OF</p>
                  <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>CTE</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900 }}>{totals.rec_normal}</p>
                    </div>
                    <div style={{ width: "1px", height: "18px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>EXT</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: theme.accent }}>{totals.rec_ext}</p>
                    </div>
                    <div style={{ width: "1px", height: "18px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>COD</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#007AFF" }}>{totals.rec_cod}</p>
                    </div>
                    <div style={{ width: "1px", height: "18px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>PXP</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#5856D6" }}>{totals.rec_pxp}</p>
                    </div>
                    {Object.keys(totals.detail_custom).map(key => (
                      <React.Fragment key={key}>
                        <div style={{ width: "1px", height: "18px", backgroundColor: theme.border, alignSelf: "center" }} />
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>{getCustomLabel(key)}</p>
                          <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: theme.primary }}>{totals.detail_custom[key].rec}</p>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: theme.accent, 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  color: "white",
                  boxShadow: `0 8px 24px -6px ${theme.accent}66`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.05em" }}>Total Recepción</p>
                  <div style={{ marginTop: "0.25rem", display: "flex", alignItems: "baseline", gap: "0.4rem", justifyContent: "center" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 900 }}>{totals.rec_normal + totals.rec_ext + totals.rec_cod + totals.rec_pxp + totals.rec_custom}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8 }}>BULTOS</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Flujo Operativo */}
              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "28px", 
                border: `1px solid ${theme.border}`, 
                padding: "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: "400px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Flujo de Paquetes por Día</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "60%" }}>
                    {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => {
                      const isActive = visibleCurves.includes(type);
                      const color = curveColors[type.toLowerCase()] || curveColors.custom;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setVisibleCurves(prev => 
                              prev.includes(type) 
                                ? prev.filter(t => t !== type) 
                                : [...prev, type]
                            );
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            border: `1px solid ${isActive ? color : theme.border}`,
                            backgroundColor: isActive ? `${color}15` : "transparent",
                            color: isActive ? color : "#888",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textTransform: "uppercase"
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ flex: 1, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorRec_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.sidebar, 
                          borderRadius: "16px", 
                          border: `1px solid ${theme.border}`,
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                          fontSize: "0.8rem",
                          fontWeight: 700
                        }}
                      />
                      {visibleCurves.map(type => (
                        <Area 
                          key={type}
                          type="monotone" 
                          dataKey={`rec_${type}`} 
                          stroke={curveColors[type.toLowerCase()] || curveColors.custom} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill={`url(#colorRec_${type})`} 
                          hide={!visibleCurves.includes(type)}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rendicion" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ 
                 marginBottom: "2rem", 
                 display: "flex", 
                 justifyContent: "space-between", 
                 alignItems: "flex-end",
                 flexWrap: "wrap",
                 gap: "1.5rem"
               }}>
                <div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Rendición Operativa</h2>
                  <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Cierre de Nomina, total entregados</p>
                </div>

                {/* Filtro de Fechas */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.75rem", 
                    backgroundColor: theme.sidebar, 
                    padding: "0.6rem 1rem", 
                    borderRadius: "16px",
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    position: "relative",
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarDays size={16} color={theme.accent} />
                    <input 
                      type="date" 
                      value={dateRange.from}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.showPicker) e.target.showPicker();
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        setDateRange(prev => ({ ...prev, from: e.target.value }));
                      }}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: theme.text, 
                        fontSize: "0.8rem", 
                        fontWeight: 700,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                  <ArrowRight size={14} color="#888" />
                  <input 
                    type="date" 
                    value={dateRange.to}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.target.showPicker) e.target.showPicker();
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDateRange(prev => ({ ...prev, to: e.target.value }));
                    }}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: theme.text, 
                      fontSize: "0.8rem", 
                      fontWeight: 700, 
                      outline: "none",
                      cursor: "pointer"
                    }}
                  />
                </div>
              </header>

              {/* Resumen de Rendición (Datos Reales) */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
                gap: "1rem", 
                marginBottom: "2rem" 
              }}>
                <div style={{ 
                  backgroundColor: theme.sidebar, 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 2px 12px -5px rgba(0,0,0,0.03)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>JORNADAS TRABAJADAS</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", justifyContent: "center" }}>
                    <span style={{ fontSize: "1.75rem", fontWeight: 900, color: theme.text }}>{stats.rendiciones.length}</span>
                    <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 700 }}>DÍAS</span>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: theme.sidebar, 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 2px 12px -5px rgba(0,0,0,0.03)",
                  textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>ENTREGADOS POR TIPO DE OF</p>
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>CTE</p>
                      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>{totals.ent_normal}</p>
                    </div>
                    <div style={{ width: "1px", height: "20px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>EXT</p>
                      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: theme.accent }}>{totals.ent_ext}</p>
                    </div>
                    <div style={{ width: "1px", height: "20px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>COD</p>
                      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#007AFF" }}>{totals.ent_cod}</p>
                    </div>
                    <div style={{ width: "1px", height: "20px", backgroundColor: theme.border, alignSelf: "center" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>PXP</p>
                      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#5856D6" }}>{totals.ent_pxp}</p>
                    </div>
                    {Object.keys(totals.detail_custom).map(key => (
                      <React.Fragment key={key}>
                        <div style={{ width: "1px", height: "20px", backgroundColor: theme.border, alignSelf: "center" }} />
                        <div>
                          <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>{getCustomLabel(key)}</p>
                          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: theme.primary }}>{totals.detail_custom[key].ent}</p>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: "#34C759", 
                  padding: "1.25rem 1.5rem", 
                  borderRadius: "20px", 
                  color: "white",
                  boxShadow: `0 8px 24px -6px rgba(52, 199, 89, 0.4)`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.05em" }}>Total Entregados</p>
                  <div style={{ marginTop: "0.25rem", display: "flex", alignItems: "baseline", gap: "0.4rem", justifyContent: "center" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 900 }}>{totals.ent_normal + totals.ent_ext + totals.ent_cod + totals.ent_pxp + totals.ent_custom}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8 }}>BULTOS</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Rendición */}
              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "28px", 
                border: `1px solid ${theme.border}`, 
                padding: "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: "400px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Rendimiento de Entrega</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "60%" }}>
                    {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => {
                      const isActive = visibleCurves.includes(type);
                      const color = curveColors[type.toLowerCase()] || curveColors.custom;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setVisibleCurves(prev => 
                              prev.includes(type) 
                                ? prev.filter(t => t !== type) 
                                : [...prev, type]
                            );
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            border: `1px solid ${isActive ? color : theme.border}`,
                            backgroundColor: isActive ? `${color}15` : "transparent",
                            color: isActive ? color : "#888",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textTransform: "uppercase"
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ flex: 1, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorEnt_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.sidebar, 
                          borderRadius: "16px", 
                          border: `1px solid ${theme.border}`,
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                          fontSize: "0.8rem",
                          fontWeight: 700
                        }}
                      />
                      {visibleCurves.map(type => (
                        <Area 
                          key={type}
                          type="monotone" 
                          dataKey={`ent_${type}`} 
                          stroke={curveColors[type.toLowerCase()] || curveColors.custom} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill={`url(#colorEnt_${type})`} 
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ingresos" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ 
                 marginBottom: "2rem", 
                 display: "flex", 
                 justifyContent: "space-between", 
                 alignItems: "flex-end",
                 flexWrap: "wrap",
                 gap: "1.5rem"
               }}>
                <div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Gestión de Ingresos</h2>
                  <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Tarifas activas sincronizadas desde la App</p>
                </div>

                {/* Filtro de Fechas */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.75rem", 
                    backgroundColor: theme.sidebar, 
                    padding: "0.6rem 1rem", 
                    borderRadius: "16px",
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    position: "relative",
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarDays size={16} color={theme.accent} />
                    <input 
                      type="date" 
                      value={dateRange.from}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.showPicker) e.target.showPicker();
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        setDateRange(prev => ({ ...prev, from: e.target.value }));
                      }}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: theme.text, 
                        fontSize: "0.8rem", 
                        fontWeight: 700,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                  <ArrowRight size={14} color="#888" />
                  <input 
                    type="date" 
                    value={dateRange.to}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.target.showPicker) e.target.showPicker();
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDateRange(prev => ({ ...prev, to: e.target.value }));
                    }}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: theme.text, 
                      fontSize: "0.8rem", 
                      fontWeight: 700, 
                      outline: "none",
                      cursor: "pointer"
                    }}
                  />
                </div>
              </header>

              {/* Módulo Dinámico de Ingresos (Sincronizado) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <IngresosModule 
                  dateRange={dateRange} 
                  externalRendiciones={stats.rendiciones} 
                />
              </div>

              {/* Gráfico de Tendencia de Ingresos (Anterior) */}
              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "28px", 
                border: `1px solid ${theme.border}`, 
                padding: "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: "350px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Historial de Liquidación</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "60%" }}>
                    {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => {
                      const isActive = visibleCurves.includes(type);
                      const color = curveColors[type.toLowerCase()] || curveColors.custom;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setVisibleCurves(prev => 
                              prev.includes(type) 
                                ? prev.filter(t => t !== type) 
                                : [...prev, type]
                            );
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            border: `1px solid ${isActive ? color : theme.border}`,
                            backgroundColor: isActive ? `${color}15` : "transparent",
                            color: isActive ? color : "#888",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textTransform: "uppercase"
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ flex: 1, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorIng_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                      />
                      <Tooltip 
                        formatter={(val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val)}
                        contentStyle={{ 
                          backgroundColor: theme.sidebar, 
                          borderRadius: "16px", 
                          border: `1px solid ${theme.border}`,
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                          fontSize: "0.8rem",
                          fontWeight: 700
                        }}
                      />
                      {visibleCurves.map(type => (
                        <Area 
                          key={type}
                          type="monotone" 
                          dataKey={`ing_${type}`} 
                          stroke={curveColors[type.toLowerCase()] || curveColors.custom} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill={`url(#colorIng_${type})`} 
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "estadisticas" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Estadísticas</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Análisis de rendimiento y KPIs operativos</p>
              </header>
              <div style={{ padding: "4rem", textAlign: "center", backgroundColor: theme.sidebar, borderRadius: "24px", border: `1px solid ${theme.border}` }}>
                <BarChart3 size={48} style={{ color: theme.accent, opacity: 0.5, marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700 }}>Panel de Estadísticas</p>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666" }}>Cargando métricas de precisión y volumen...</p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ marginBottom: "3rem" }}>
                <h2 style={{ fontSize: "2.25rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Vincular Settings</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem", fontSize: "1.05rem" }}>Sincroniza tus preferencias con la aplicación móvil</p>
              </header>
              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "24px", 
                border: `1px solid ${theme.border}`,
                padding: "2.5rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)"
              }}>
                <div style={{ marginBottom: "2rem" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>Vinculación de Cuenta</h4>
                  <div style={{ padding: "1.5rem", backgroundColor: theme.card, borderRadius: "16px", border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                     <RefreshCcw size={32} style={{ color: theme.primary, marginBottom: '1rem' }} />
                     <p style={{ fontWeight: 700, margin: '0 0 0.5rem' }}>Escanear Código QR</p>
                     <p style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666", margin: "0 0 1.5rem" }}>Abre la App GestionSTK en tu teléfono y escanea este panel para sincronizar tus sectores y zonas personalizadas.</p>
                     <div style={{ width: '150px', height: '150px', backgroundColor: '#EEE', margin: '0 auto', display: 'flex', alignItems: 'center', justifyItems: 'center', borderRadius: '12px', border: `2px dashed ${theme.border}` }}>
                        <span style={{ fontSize: '0.7rem', color: '#999', width: '100%' }}>QR Placeholder</span>
                     </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>Apariencia (Sincronizada)</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", backgroundColor: theme.card, borderRadius: "16px", border: `1px solid ${theme.border}` }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Tema Visual</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: isDark ? "#888" : "#666" }}>Actualmente: {isDark ? 'Dark Mode (GestionSTK)' : 'Light Mode (GestionSTK)'}</p>
                    </div>
                    <button onClick={toggleTheme} style={{ 
                        padding: "0.6rem 1.25rem", 
                        borderRadius: "12px", 
                        cursor: "pointer", 
                        backgroundColor: theme.accent, 
                        color: "white", 
                        border: "none",
                        fontWeight: 700,
                        fontSize: "0.85rem"
                      }}>
                      Cambiar Tema
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// function RateTag({ label, value, color, textColor }) {
//   return (
//     <div style={{ 
//       display: "flex", 
//       alignItems: "center", 
//       gap: "0.5rem", 
//       backgroundColor: color, 
//       padding: "0.4rem 0.75rem", 
//       borderRadius: "10px",
//       border: "1px solid rgba(0,0,0,0.05)",
//       boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
//       whiteSpace: "nowrap"
//     }}>
//       <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(0,0,0,0.5)", textTransform: "uppercase" }}>{label}</span>
//       <span style={{ fontSize: "0.85rem", fontWeight: 900, color: textColor }}>{value}</span>
//     </div>
//   );
// }

function SidebarItem({ icon, label, active, onClick, theme }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0.9rem 1.15rem",
        borderRadius: "14px",
        border: "none",
        backgroundColor: active ? (theme.accent + "12") : "transparent",
        color: active ? theme.accent : theme.text,
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        textAlign: "left",
        opacity: active ? 1 : 0.7
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ color: active ? theme.accent : "inherit" }}>{icon}</span>
        <span style={{ fontWeight: active ? 800 : 600, fontSize: "0.925rem" }}>{label}</span>
      </div>
      {active && <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: theme.accent }} />}
    </button>
  );
}

function StatCard({ label, value, color, theme }) {
  return (
    <div style={{ 
      backgroundColor: theme.sidebar, 
      padding: "1.25rem 1.5rem", 
      borderRadius: "20px", 
      border: `1px solid ${theme.border}`,
      boxShadow: "0 2px 12px -5px rgba(0,0,0,0.03)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }}>
      <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 900, color }}>{value}</p>
    </div>
  );
}


