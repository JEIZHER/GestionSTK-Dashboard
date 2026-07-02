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
  ArrowRight,
  Monitor
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
import EditActivityModal from './EditActivityModal';

export default function DashboardHome() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [cuentaHistorial, setCuentaHistorial] = useState([]);
  // Kept for display purposes — the latest record
  const [cuenta, setCuenta] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalSectores: 0,
    totalContactos: 0,
    promedioPrecision: 0,
    rendiciones: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [visibleCurves, setVisibleCurves] = useState(['total']);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      if (width <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Prevenir que el navegador muestre el prompt automático
      e.preventDefault();
      // Guardar el evento para dispararlo más tarde
      setDeferredPrompt(e);
      // Mostrar nuestro banner personalizado
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt nativo
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Limpiar el prompt guardado
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

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
        kpi_logrado: undefined,
      };

      if (r.kpi_logrado !== undefined && r.kpi_logrado !== null) {
        existing.kpi_logrado = r.kpi_logrado;
      }

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
          kpi_logrado: item.kpi_logrado !== undefined ? item.kpi_logrado : (kpiActual >= 95),
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

  // Returns the cuenta record that was active on a given date (YYYY-MM-DD)
  const getHistoricalCuenta = (fecha) => {
    if (!cuentaHistorial || cuentaHistorial.length === 0) return cuenta;
    // Find the last record whose created_at is <= the rendition date
    const dateTs = new Date(fecha + 'T23:59:59').getTime();
    let active = null;
    for (const c of cuentaHistorial) {
      const cTs = new Date(c.created_at).getTime();
      if (cTs <= dateTs) active = c;
    }
    // Fallback to the earliest known record if no historical match
    return active || cuentaHistorial[0] || cuenta;
  };

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

            const hc = getHistoricalCuenta(r.fecha);
            const config = parseTarifasCustom(hc?.tarifas_custom)?.find(t => t.nombre === key || t.label === key);
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

        const hc = getHistoricalCuenta(r.fecha);
        const c_kpiCte = hc?.kpi_cte || 0; const c_cte = hc?.pago_nacional || 0;
        const c_kpiExt = hc?.kpi_ext || 0; const c_ext = hc?.pago_extranjero || 0;
        const c_kpiCod = hc?.kpi_cod || 0; const c_cod = hc?.pago_cod || 0;
        const c_kpiPxp = hc?.kpi_pxp || 0; const c_pxp = hc?.pago_pxp || 0;

        const ingCte = (r.ent_cte || 0) * (Number(c_kpiCte) > 0 ? (kpiLogrado ? Number(c_kpiCte) : Number(c_cte)) : Number(c_cte));
        const ingExt = (r.ent_ext || 0) * (Number(c_kpiExt) > 0 ? (kpiLogrado ? Number(c_kpiExt) : Number(c_ext)) : Number(c_ext));
        const ingCod = (r.ent_cod || 0) * (Number(c_kpiCod) > 0 ? (kpiLogrado ? Number(c_kpiCod) : Number(c_cod)) : Number(c_cod));
        const ingPxp = (r.ent_pxp || 0) * (Number(c_kpiPxp) > 0 ? (kpiLogrado ? Number(c_kpiPxp) : Number(c_pxp)) : Number(c_pxp));

        return {
          name: (() => {
             const [year, month, day] = (r.fecha || '').split('T')[0].split('-');
             if (!year || !month || !day) return 'Sin fecha';
             return new Date(year, month - 1, day).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
          })(),
          
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

        const { data: cuentaHistorialData, error: cuentaError } = await supabase
          .from("cuenta")
          .select("*")
          .eq("auth_id", user.id)
          .order("created_at", { ascending: true });

        if (cuentaError && cuentaError.code !== "PGRST116") throw cuentaError;
        const historial = cuentaHistorialData || [];
        setCuentaHistorial(historial);
        // The last record is the currently active one (for display cards, etc.)
        setCuenta(historial.length > 0 ? historial[historial.length - 1] : null);

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

        // 6. Fetch recent activity (Actividad Reciente) independent of date filter
        const { data: recentRendiciones } = await supabase
          .from("rendiciones_diarias")
          .select("*")
          .eq("auth_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        const { data: recentPrecision } = await supabase
          .from("reportes_precision")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        const mapActivity = new Map();
        
        (recentRendiciones || []).forEach(r => {
           if(!mapActivity.has(r.fecha)) mapActivity.set(r.fecha, { fecha: r.fecha, rendicion: r, precision: null });
           else mapActivity.get(r.fecha).rendicion = r;
        });
        
        (recentPrecision || []).forEach(p => {
           if(!mapActivity.has(p.fecha)) mapActivity.set(p.fecha, { fecha: p.fecha, rendicion: null, precision: p });
           else mapActivity.get(p.fecha).precision = p;
        });

        const recentActivityRaw = Array.from(mapActivity.values())
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          
        setRecentActivity(recentActivityRaw);

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
  }, [user, dateRange, refreshKey]);

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
        width: isSidebarOpen ? (isMobile ? "100%" : "280px") : "0px", 
        backgroundColor: theme.sidebar, 
        borderRight: isSidebarOpen ? `1px solid ${theme.border}` : "none",
        display: "flex",
        flexDirection: "column",
        padding: isSidebarOpen ? "1.5rem" : "0",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        height: "100vh",
        boxShadow: isDark || !isSidebarOpen ? "none" : "4px 0 24px rgba(0,0,0,0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 1000
      }}>
        <div style={{ flex: 1, opacity: isSidebarOpen ? 1 : 0, transition: "opacity 0.2s", minWidth: isMobile ? "auto" : "240px" }}>
          <div style={{ marginBottom: "2.5rem", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                style={{ padding: "0.5rem", background: "none", border: "none", color: theme.text }}
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <SidebarItem 
              icon={<LayoutDashboard size={19} />} 
              label="Dashboard" 
              active={activeTab === "inventory"} 
              onClick={() => { setActiveTab("inventory"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
            <SidebarItem 
              icon={<PackageCheck size={19} />} 
              label="RECEPCIÓN" 
              active={activeTab === "recepcion"} 
              onClick={() => { setActiveTab("recepcion"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
            <SidebarItem 
              icon={<ClipboardList size={19} />} 
              label="RENDICIÓN" 
              active={activeTab === "rendicion"} 
              onClick={() => { setActiveTab("rendicion"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
            <SidebarItem 
              icon={<Wallet size={19} />} 
              label="INGRESOS" 
              active={activeTab === "ingresos"} 
              onClick={() => { setActiveTab("ingresos"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
            <SidebarItem 
              icon={<BarChart3 size={19} />} 
              label="ESTADÍSTICAS" 
              active={activeTab === "estadisticas"} 
              onClick={() => { setActiveTab("estadisticas"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
            <SidebarItem 
              icon={<Settings size={19} />} 
              label="Vincular Settings" 
              active={activeTab === "settings"} 
              onClick={() => { setActiveTab("settings"); if(isMobile) setIsSidebarOpen(false); }}
              theme={theme}
            />
          </nav>
        </div>

        <div style={{ 
          borderTop: `1px solid ${theme.border}`, 
          paddingTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
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
        {/* Banner de Instalación PWA */}
        {showInstallBanner && (
          <div style={{
            backgroundColor: theme.primary,
            padding: "0.75rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            color: "black",
            fontSize: "0.85rem",
            fontWeight: 700,
            position: "sticky",
            top: 0,
            zIndex: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            animation: "slideDown 0.5s ease-out"
          }}>
            <Monitor size={18} />
            <span>¿Quieres usar el Dashboard como una aplicación de PC?</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={handleInstallClick}
                style={{
                  backgroundColor: "black",
                  color: "white",
                  border: "none",
                  padding: "0.4rem 1rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "0.75rem"
                }}
              >
                Instalar aquí
              </button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                style={{
                  backgroundColor: "rgba(0,0,0,0.1)",
                  color: "black",
                  border: "none",
                  padding: "0.4rem 1rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "0.75rem"
                }}
              >
                Omitir
              </button>
            </div>
            <style>{`
              @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
              }
            `}</style>
          </div>
        )}

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
          maxWidth: "1300px", 
          margin: "0 auto", 
          padding: isMobile ? "1.5rem 1rem 1.5rem 1rem" : "1.5rem 2rem 1.5rem 3.5rem",
          minHeight: "100%"
        }}>
          {activeTab === "inventory" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ 
                 marginBottom: "1.5rem", 
                 flexWrap: "wrap", 
                 gap: "1rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <h2 style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>
                  Dashboard
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", marginTop: "0.5rem" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: theme.accent, fontSize: "0.85rem", fontWeight: 800 }}>
                      <User size={14} />
                      {profile?.nombre}
                   </div>
                   <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: theme.border }} />
                   <span style={{ fontSize: "0.85rem", fontWeight: 700, color: theme.text }}>{profile?.region_asignada}</span>
                </div>
              </header>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "1rem", 
                marginBottom: "2rem" 
              }}>
                  <StatCard label="Sectores" value={stats.totalSectores} color={theme.accent} theme={theme} />
                  <StatCard label="Contactos" value={stats.totalContactos} color={theme.primary} theme={theme} />
                  <StatCard label="OF Auto deteccion" value={`${stats.promedioPrecision}%`} color="#34C759" theme={theme} />
              </div>

              <div style={{ 
                backgroundColor: theme.sidebar, 
                borderRadius: "24px", 
                border: `1px solid ${theme.border}`,
                padding: isMobile ? "1.5rem" : "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)"
              }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Actividad Reciente</h3>
                    {recentActivity.length > 3 && (
                      <button 
                        onClick={() => setShowAllActivity(!showAllActivity)}
                        style={{ color: theme.accent, fontSize: "0.8rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                        {showAllActivity ? "Ver menos" : "Ver todo"}
                      </button>
                    )}
                 </div>
                 
                 {/* Tarifa change notes from last 5 days */}
                 {(() => {
                   const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
                   const now = Date.now();
                   const LABELS = {
                     kpi: 'KPI',
                     pago_nacional: 'Nacional (base)',
                     kpi_cte: 'Nacional (KPI)',
                     pago_extranjero: 'EXT (base)',
                     kpi_ext: 'EXT (KPI)',
                     pago_cod: 'COD (base)',
                     kpi_cod: 'COD (KPI)',
                     pago_pxp: 'PxP (base)',
                     kpi_pxp: 'PxP (KPI)',
                   };
                   const changes = [];
                   for (let i = 1; i < cuentaHistorial.length; i++) {
                     const curr = cuentaHistorial[i];
                     const prev = cuentaHistorial[i - 1];
                     const ts = new Date(curr.created_at).getTime();
                     if (now - ts > FIVE_DAYS_MS) continue;
                     const diffs = [];
                     Object.keys(LABELS).forEach(field => {
                       const vPrev = prev[field]; const vCurr = curr[field];
                       if (String(vPrev) !== String(vCurr)) {
                         diffs.push(`${LABELS[field]}: ${vPrev ?? '-'} → ${vCurr ?? '-'}`);
                       }
                     });
                     // Check custom tariffs
                     const prevCustom = JSON.stringify(prev.tarifas_custom);
                     const currCustom = JSON.stringify(curr.tarifas_custom);
                     if (prevCustom !== currCustom) diffs.push('Tarifas custom modificadas');
                     if (diffs.length > 0) {
                       const d = new Date(curr.created_at);
                       changes.push({ ts: d, diffs });
                     }
                   }
                   if (changes.length === 0) return null;
                   return changes.map((ch, idx) => (
                     <div key={`tc_${idx}`} style={{
                       padding: '1rem',
                       backgroundColor: isDark ? 'rgba(94,92,230,0.07)' : '#F0EFFE',
                       borderRadius: '12px',
                       borderLeft: '4px solid #5E5CE6',
                       marginBottom: '1rem'
                     }}>
                       <p style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: "0.9rem", color: '#5E5CE6' }}>
                         ⚙️ Ajuste de tarifas
                       </p>
                       <p style={{ margin: '0 0 0.4rem', fontSize: "0.78rem", color: isDark ? '#888' : '#666' }}>
                         {ch.ts.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })} a las {ch.ts.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                       </p>
                       {ch.diffs.map((d, j) => (
                         <span key={j} style={{
                           display: 'inline-block',
                           fontSize: '0.75rem',
                           fontWeight: 600,
                           backgroundColor: isDark ? 'rgba(94,92,230,0.15)' : '#E0DEFF',
                           color: isDark ? '#A89FF5' : '#3634A3',
                           padding: '0.2rem 0.5rem',
                           borderRadius: '6px',
                           margin: '0.15rem 0.2rem 0 0'
                         }}>{d}</span>
                       ))}
                     </div>
                   ));
                 })()}

                 {recentActivity.length === 0 ? (
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
                      <p style={{ fontSize: "0.9rem" }}>No hay movimientos registrados recientes</p>
                   </div>
                 ) : (
                   <div style={{ 
                     display: "flex", 
                     flexDirection: "column", 
                     gap: "1rem", 
                     maxHeight: showAllActivity ? "400px" : "auto", 
                     overflowY: showAllActivity ? "auto" : "visible",
                     paddingRight: showAllActivity ? "0.5rem" : "0"
                   }}>
                     {recentActivity.slice(0, showAllActivity ? 30 : 7).map((act, i) => {
                       const status = (act.rendicion && act.precision) ? "ok" : "warning";
                       const createdAt = new Date(act.rendicion?.created_at || act.precision?.created_at || act.fecha);
                       const createdTimeStr = createdAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                       const createdShortDate = createdAt.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
                       const dateStr = (() => {
                         const [y, m, d] = (act.fecha || '').split('T')[0].split('-');
                         if (!y || !m || !d) return act.fecha;
                         return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
                       })();
                       
                       // Discrepancy check
                       const rendTotalRec = act.rendicion
                         ? (act.rendicion.rec_cte||0) + (act.rendicion.rec_ext||0) + (act.rendicion.rec_cod||0) + (act.rendicion.rec_pxp||0) +
                           (() => { try { const c = typeof act.rendicion.datos_custom === 'string' ? JSON.parse(act.rendicion.datos_custom) : (act.rendicion.datos_custom||{}); return Object.values(c).reduce((s,v) => s+(v.rec||0), 0); } catch(e){ return 0; } })()
                         : null;
                       const precTotal = act.precision ? (act.precision.total_ofs ?? null) : null;
                       const hasDiscrepancy = rendTotalRec !== null && precTotal !== null && rendTotalRec !== precTotal;
                       
                       return (
                         <div 
                           key={i} 
                           onClick={() => setEditingActivity(act)}
                           style={{ 
                             display: "flex", 
                             alignItems: "center", 
                             justifyContent: "space-between",
                             padding: "0.6rem 1rem",
                             backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA",
                             borderRadius: "12px",
                             borderLeft: `4px solid ${status === "ok" ? "#34C759" : "#FF9500"}`,
                             cursor: "pointer",
                             transition: "background-color 0.2s"
                           }}
                           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#F0F0F0"}
                           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                         >
                           <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span>Día reportado: {dateStr}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#888' : '#999' }}>Reg. {createdShortDate} H:{createdTimeStr}</span>
                              </p>
                           </div>
                           <div style={{ textAlign: "right" }}>
                             {hasDiscrepancy && (
                                <div style={{ fontSize: "0.72rem", color: "#FF3B30", fontWeight: 700, backgroundColor: isDark ? "rgba(255,59,48,0.1)" : "#FFF0EE", padding: "0.25rem 0.5rem", borderRadius: "6px", marginBottom: "0.4rem" }}>
                                  ⚠ Rend: {rendTotalRec} / Prec: {precTotal} OFs
                                </div>
                              )}
                             {status === "ok" ? (
                               <span style={{ fontSize: "0.8rem", color: "#34C759", fontWeight: 700, backgroundColor: isDark ? "rgba(52, 199, 89, 0.1)" : "#E8F8EE", padding: "0.3rem 0.6rem", borderRadius: "8px" }}>Completado</span>
                             ) : (
                               <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "flex-end" }}>
                                 <span style={{ fontSize: "0.8rem", color: "#FF9500", fontWeight: 700, backgroundColor: isDark ? "rgba(255, 149, 0, 0.1)" : "#FFF4E5", padding: "0.3rem 0.6rem", borderRadius: "8px" }}>Incompleto</span>
                                 <span style={{ fontSize: "0.7rem", color: isDark ? "#888" : "#999" }}>
                                   {(!act.rendicion) && "Falta Rendición Diaria"}
                                   {(!act.precision) && "Falta Reporte Precisión"}
                                 </span>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === "recepcion" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ 
                 marginBottom: "2rem", 
                 display: "flex", 
                 justifyContent: "space-between", 
                 alignItems: isMobile ? "flex-start" : "flex-end",
                 flexDirection: isMobile ? "column" : "row",
                 flexWrap: "wrap",
                 gap: "1rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Recepción de Carga</h2>
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
                    zIndex: 1000,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarDays size={16} color={theme.accent} />
                    <input 
                      id="inventory_date_from"
                      name="inventory_date_from"
                      aria-label="Fecha inicio inventario"
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
                        cursor: "pointer",
                        width: isMobile ? "85px" : "auto"
                      }}
                    />
                  </div>
                  <ArrowRight size={14} color="#888" />
                  <input 
                    id="inventory_date_to"
                    name="inventory_date_to"
                    aria-label="Fecha fin inventario"
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
                      cursor: "pointer",
                      width: isMobile ? "85px" : "auto"
                    }}
                  />
                </div>
              </header>

              {/* Resumen de Recepción */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", 
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
                  <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.55rem", color: "#888", fontWeight: 700 }}>CTE</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900 }}>{totals.rec_normal}</p>
                    </div>
                    {/* ... grid separators logic ... */}
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
                padding: isMobile ? "1.5rem" : "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: isMobile ? "350px" : "400px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: isMobile ? "flex-start" : "center", 
                  flexDirection: isMobile ? "column" : "row",
                  marginBottom: "2rem",
                  gap: "1rem"
                }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Flujo de Paquetes por Día</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end", maxWidth: isMobile ? "100%" : "60%" }}>
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
                <div style={{ flex: 1, width: "100%", marginLeft: isMobile ? "-15px" : "0" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: isMobile ? -30 : -20, bottom: 40 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorRec_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis angle={-45} textAnchor="end" height={80} 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        width={60}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)}
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
                 alignItems: isMobile ? "flex-start" : "flex-end",
                 flexDirection: "row",
                 flexWrap: "wrap",
                 gap: "1.5rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Rendición Operativa</h2>
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
                      id="rendiciones_date_from"
                      name="rendiciones_date_from"
                      aria-label="Fecha inicio rendiciones"
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
                    id="rendiciones_date_to"
                    name="rendiciones_date_to"
                    aria-label="Fecha fin rendiciones"
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
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", 
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
                padding: isMobile ? "1.5rem" : "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: isMobile ? "350px" : "400px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: isMobile ? "flex-start" : "center", 
                  flexDirection: isMobile ? "column" : "row",
                  marginBottom: "2rem",
                  gap: "1rem"
                }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Rendimiento de Entrega</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end", maxWidth: isMobile ? "100%" : "60%" }}>
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

                <div style={{ flex: 1, width: "100%", marginLeft: isMobile ? "-15px" : "0" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: isMobile ? -30 : -20, bottom: 40 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorEnt_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis angle={-45} textAnchor="end" height={80} 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        width={60}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)}
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
                 alignItems: isMobile ? "flex-start" : "flex-end",
                 flexDirection: isMobile ? "column" : "row",
                 flexWrap: "wrap",
                 gap: "1.5rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Gestión de Ingresos</h2>
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
                    zIndex: 1000,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarDays size={16} color={theme.accent} />
                    <input 
                      id="precision_date_from"
                      name="precision_date_from"
                      aria-label="Fecha inicio precisión"
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
                        cursor: "pointer",
                        width: isMobile ? "85px" : "auto"
                      }}
                    />
                  </div>
                  <ArrowRight size={14} color="#888" />
                  <input 
                    id="precision_date_to"
                    name="precision_date_to"
                    aria-label="Fecha fin precisión"
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
                      cursor: "pointer",
                      width: isMobile ? "85px" : "auto"
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
                padding: isMobile ? "1.5rem" : "2rem",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)",
                height: isMobile ? "350px" : "350px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: isMobile ? "flex-start" : "center", 
                  flexDirection: isMobile ? "column" : "row",
                  marginBottom: "2rem",
                  gap: "1rem"
                }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Historial de Liquidación</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end", maxWidth: isMobile ? "100%" : "60%" }}>
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

                <div style={{ flex: 1, width: "100%", marginLeft: isMobile ? "-15px" : "0" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: isMobile ? -30 : -20, bottom: 40 }}>
                      <defs>
                        {['total', 'cte', 'ext', 'cod', 'pxp', ...Object.keys(totals.detail_custom).map(getCustomLabel)].map(type => (
                          <linearGradient key={type} id={`colorIng_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={curveColors[type.toLowerCase()] || curveColors.custom} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#222" : "#F0F0F0"} />
                      <XAxis angle={-45} textAnchor="end" height={80} 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        dy={10}
                      />
                      <YAxis 
                        width={80}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#888" }}
                        tickFormatter={(val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', notation: 'compact' }).format(val)}
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
               <header style={{ 
                 marginBottom: "2rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <h2 style={{ fontSize: isMobile ? "1.5rem" : "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Estadísticas</h2>
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
               <header style={{ 
                 marginBottom: "3rem",
                 paddingLeft: (isMobile && !isSidebarOpen) ? "2.5rem" : "0",
                 transition: "padding 0.3s"
               }}>
                <h2 style={{ fontSize: isMobile ? "1.8rem" : "2.25rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Vincular Settings</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem", fontSize: isMobile ? "0.95rem" : "1.05rem" }}>Sincroniza tus preferencias con la aplicación móvil</p>
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
      <EditActivityModal 
        isOpen={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        activity={editingActivity}
        onSave={() => {
          setEditingActivity(null);
          setRefreshKey(prev => prev + 1);
        }}
        theme={theme}
        isDark={isDark}
        user={user}
        cuenta={cuenta}
      />
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


