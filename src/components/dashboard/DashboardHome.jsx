import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import logo from "../../assets/logo.png";
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  ChevronRight,
  ChevronLeft,
  Shield,
  LayoutDashboard,
  Box,
  ExternalLink,
  Menu,
  RefreshCcw,
  PackageCheck,
  ClipboardList,
  Wallet,
  BarChart3
} from "lucide-react";

export default function DashboardHome() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalSectores: 0,
    totalContactos: 0,
    promedioPrecision: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");

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
        
        // Limpiar el valor de region_asignada (quitando Saltos de línea ocultos \r\n)
        const cleanRegion = profileData.region_asignada?.replace(/[\r\n\t]/g, "").trim();
        const cleanProfile = { ...profileData, region_asignada: cleanRegion };
        
        setProfile(cleanProfile);

        // 2. Fetch Count Sectores (filtrado por la región limpia)
        const { count: sectoresCount, error: sectoresError } = await supabase
          .from("sectores")
          .select("*", { count: "exact", head: true })
          .eq("region_asignada", cleanRegion);
        
        if (sectoresError) throw sectoresError;

        // 3. Fetch Count Contactos (filtrado por la región limpia)
        const { count: contactosCount, error: contactosError } = await supabase
          .from("contactos")
          .select("*", { count: "exact", head: true })
          .eq("region_asignada", cleanRegion);
        
        if (contactosError) throw contactosError;

        // 4. Fetch Precision Average
        const { data: precisionData, error: precisionError } = await supabase
          .from("reportes_precision")
          .select("precision_percent");
        
        if (precisionError) throw precisionError;

        const avg = precisionData.length > 0 
          ? (precisionData.reduce((acc, curr) => acc + (curr.precision_percent || 0), 0) / precisionData.length).toFixed(1)
          : 0;

        setStats({
          totalSectores: sectoresCount || 0,
          totalContactos: contactosCount || 0,
          promedioPrecision: avg
        });

      } catch (err) {
        console.error("Error al cargar datos dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

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
                  <StatCard label="Precisión" value={`${stats.promedioPrecision}%`} color="#34C759" theme={theme} />
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
               <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Recepción de Carga</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Control de entrada y verificación de bultos</p>
              </header>
              <div style={{ padding: "4rem", textAlign: "center", backgroundColor: theme.sidebar, borderRadius: "24px", border: `1px solid ${theme.border}` }}>
                <PackageCheck size={48} style={{ color: theme.accent, opacity: 0.5, marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700 }}>Módulo de Recepción</p>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666" }}>Próximamente: Integración con escáner móvil</p>
              </div>
            </div>
          )}

          {activeTab === "rendicion" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Rendición</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Cierre de planilla y liquidación de servicios</p>
              </header>
              <div style={{ padding: "4rem", textAlign: "center", backgroundColor: theme.sidebar, borderRadius: "24px", border: `1px solid ${theme.border}` }}>
                <ClipboardList size={48} style={{ color: theme.accent, opacity: 0.5, marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700 }}>Módulo de Rendición</p>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666" }}>Próximamente: Resumen de pagos y saldos</p>
              </div>
            </div>
          )}

          {activeTab === "ingresos" && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
               <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Ingresos</h2>
                <p style={{ color: isDark ? "#888" : "#666", marginTop: "0.5rem" }}>Flujo de caja y recaudación diaria</p>
              </header>
              <div style={{ padding: "4rem", textAlign: "center", backgroundColor: theme.sidebar, borderRadius: "24px", border: `1px solid ${theme.border}` }}>
                <Wallet size={48} style={{ color: theme.accent, opacity: 0.5, marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700 }}>Módulo de Ingresos</p>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#888" : "#666" }}>Visualización de recaudación por sector</p>
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

function DataRow({ label, value, theme, isDark, isBadge = false, isMono = false }) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      borderBottom: `1px solid ${theme.border}`, 
      paddingBottom: "1.25rem" 
    }}>
      <span style={{ 
        fontSize: "0.75rem", 
        fontWeight: 800, 
        color: isDark ? "#666" : "#999", 
        textTransform: "uppercase", 
        letterSpacing: "0.08em" 
      }}>
        {label}
      </span>
      <span style={{ 
        fontWeight: 700, 
        color: theme.text,
        backgroundColor: isBadge ? (theme.primary + "15") : "transparent",
        padding: isBadge ? "0.35rem 1rem" : "0",
        borderRadius: "10px",
        fontSize: isBadge ? "0.8rem" : "1rem",
        fontFamily: isMono ? "monospace" : "inherit"
      }}>
        {value || "Pendiente"}
      </span>
    </div>
  );
}

