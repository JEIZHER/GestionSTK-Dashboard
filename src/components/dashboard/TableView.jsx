import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const parseTarifasCustom = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
};

const fmtCLP = (v) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v || 0);

const fmtDate = (fecha) => {
  const [y, m, d] = String(fecha).split("T")[0].split("-");
  if (!y || !m || !d) return fecha;
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" });
};

const IVA_RATE = 0.19;

const FECHA_W = 70; // px — increased 10% from 48px

// Colores de área
const AREA = {
  rec:   { light: "#EFF6FF", dark: "#0F2340", text: "#1D4ED8", totalBg: { light: "#DBEAFE", dark: "#0A1C30" }, border: "#93C5FD" },
  rend:  { light: "#ECFDF5", dark: "#0A2A1A", text: "#065F46", totalBg: { light: "#D1FAE5", dark: "#072015" }, border: "#6EE7B7" },
  pagos: { light: "#FFFBEB", dark: "#2A1A06", text: "#92400E", totalBg: { light: "#FEF3C7", dark: "#3A2006" }, border: "#FCD34D" },
  total: { light: "#FDE68A", dark: "#3A2006", text: "#78350F", totalBg: { light: "#FDE68A", dark: "#3A2006" }, border: "#F59E0B" },
};

function areaBg(area, isDark) { return isDark ? AREA[area].dark : AREA[area].light; }
function areaBorder(area) { return `2px solid ${AREA[area].border}`; }

// Celda de datos compacta con tinte de área como borde izquierdo
function Num({ v, bold, area, isFirst, isTotal, isDark }) {
  return (
    <td style={{
      textAlign: "center",
      padding: "5px 2px",
      fontSize: "9px",
      fontWeight: bold ? 700 : 400,
      whiteSpace: "nowrap",
      maxWidth: "44px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      background: isTotal ? (isDark ? AREA[area].totalBg.dark : AREA[area].totalBg.light) : undefined,
      borderLeft: isFirst ? areaBorder(area) : undefined,
    }}>
      {v ?? "—"}
    </td>
  );
}

// Celda de pago compacta con tinte
function Pay({ v, bold, area, isFirst, isTotal, isDark, color }) {
  return (
    <td style={{
      padding: "5px 2px",
      textAlign: "center",
      fontSize: "9px",
      fontWeight: bold ? 800 : 400,
      whiteSpace: "nowrap",
      background: isTotal ? (isDark ? AREA[area].totalBg.dark : AREA[area].totalBg.light) : undefined,
      color: color || undefined,
      borderLeft: isFirst ? areaBorder(area) : undefined,
    }}>
      {fmtCLP(v)}
    </td>
  );
}

// Encabezado compacto
function HC({ children, colSpan, style = {}, fontSize = 10 }) {
  return (
    <th colSpan={colSpan} style={{
      padding: "5px 2px",
      textAlign: "center",
      fontSize: `${fontSize}px`,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      ...style,
    }}>
      {children}
    </th>
  );
}

export default function TableView({ rendiciones, cuentaHistorial, cuenta }) {
  const { isDark } = useTheme();

  const border = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E5E7EB";
  const bg = isDark ? "#111" : "#fff";
  const bgHeader = isDark ? "#1A1A1A" : "#F9FAFB";
  const bgSummary = isDark ? "#1E1E1E" : "#FFF9E6";
  const textMuted = isDark ? "#888" : "#6B7280";

  const getHC = (fecha) => {
    if (!cuentaHistorial || cuentaHistorial.length === 0) return cuenta;
    const ts = new Date(fecha + "T23:59:59").getTime();
    let active = null;
    for (const c of cuentaHistorial) {
      if (new Date(c.created_at).getTime() <= ts) active = c;
    }
    return active || cuentaHistorial[0] || cuenta;
  };

  const customKeys = useMemo(() => {
    const keys = new Set();
    (rendiciones || []).forEach((r) => {
      const dc = typeof r.datos_custom === "string" ? JSON.parse(r.datos_custom || "{}") : r.datos_custom;
      if (dc && typeof dc === "object") Object.keys(dc).forEach((k) => keys.add(k));
    });
    return Array.from(keys).sort();
  }, [rendiciones]);

  const rows = useMemo(() => {
    return (rendiciones || []).slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).map((r) => {
      const hc = getHC(r.fecha);
      const kpiLogrado = r.kpi_logrado !== undefined ? r.kpi_logrado : true;
      const dc = typeof r.datos_custom === "string" ? JSON.parse(r.datos_custom || "{}") : r.datos_custom || {};
      const price = (base, kpiP) => Number(kpiP) > 0 ? (kpiLogrado ? Number(kpiP) : Number(base)) : Number(base);
      const ingCte = (r.ent_cte || 0) * price(hc?.pago_nacional || 0, hc?.kpi_cte || 0);
      const ingExt = (r.ent_ext || 0) * price(hc?.pago_extranjero || 0, hc?.kpi_ext || 0);
      const ingCod = (r.ent_cod || 0) * price(hc?.pago_cod || 0, hc?.kpi_cod || 0);
      const ingPxp = (r.ent_pxp || 0) * price(hc?.pago_pxp || 0, hc?.kpi_pxp || 0);
      const tarifasCustom = parseTarifasCustom(hc?.tarifas_custom);
      const customRec = {}; const customEnt = {}; const customIng = {};
      customKeys.forEach((k) => {
        const item = dc[k] || {};
        customRec[k] = item.rec || 0;
        customEnt[k] = item.ent || 0;
        const cfg = tarifasCustom.find((t) => t.nombre === k || t.label === k);
        customIng[k] = cfg && customEnt[k] > 0
          ? customEnt[k] * (cfg.depende_kpi && kpiLogrado ? cfg.con_kpi || 0 : cfg.base || 0)
          : 0;
      });
      const ingTotal = ingCte + ingExt + ingCod + ingPxp + customKeys.reduce((s, k) => s + customIng[k], 0);
      const iva = Math.round(ingTotal * IVA_RATE);
      const recStd = (r.rec_cte||0)+(r.rec_ext||0)+(r.rec_cod||0)+(r.rec_pxp||0);
      const entStd = (r.ent_cte||0)+(r.ent_ext||0)+(r.ent_cod||0)+(r.ent_pxp||0);
      return {
        fecha: r.fecha, kpiLogrado,
        rec_cte: r.rec_cte||0, rec_ext: r.rec_ext||0, rec_cod: r.rec_cod||0, rec_pxp: r.rec_pxp||0,
        rec_total: recStd + customKeys.reduce((s,k)=>s+customRec[k],0),
        ent_cte: r.ent_cte||0, ent_ext: r.ent_ext||0, ent_cod: r.ent_cod||0, ent_pxp: r.ent_pxp||0,
        ent_total: entStd + customKeys.reduce((s,k)=>s+customEnt[k],0),
        customRec, customEnt, customIng,
        ing_cte: ingCte, ing_ext: ingExt, ing_cod: ingCod, ing_pxp: ingPxp,
        ing_total: ingTotal, iva, total_con_iva: ingTotal + iva,
      };
    });
  }, [rendiciones, cuentaHistorial, cuenta, customKeys]);

  const sum = useMemo(() => {
    const s = { rec_cte:0,rec_ext:0,rec_cod:0,rec_pxp:0,rec_total:0,ent_cte:0,ent_ext:0,ent_cod:0,ent_pxp:0,ent_total:0,ing_cte:0,ing_ext:0,ing_cod:0,ing_pxp:0,ing_total:0,iva:0,total_con_iva:0,customRec:{},customEnt:{},customIng:{},jornadas:rows.length };
    customKeys.forEach((k)=>{ s.customRec[k]=0; s.customEnt[k]=0; s.customIng[k]=0; });
    rows.forEach((r)=>{
      ["rec_cte","rec_ext","rec_cod","rec_pxp","rec_total","ent_cte","ent_ext","ent_cod","ent_pxp","ent_total","ing_cte","ing_ext","ing_cod","ing_pxp","ing_total","iva","total_con_iva"].forEach(f=>{ s[f]+=r[f]; });
      customKeys.forEach((k)=>{ s.customRec[k]+=r.customRec[k]||0; s.customEnt[k]+=r.customEnt[k]||0; s.customIng[k]+=r.customIng[k]||0; });
    });
    return s;
  }, [rows, customKeys]);

  const kpiGlobal = sum.rec_total > 0 ? ((sum.ent_total / sum.rec_total)*100).toFixed(1) : "—";
  const kpiTarget = cuenta?.kpi || 95;
  const kpiOk = kpiGlobal !== "—" && Number(kpiGlobal) >= kpiTarget;

  const recCols = 4 + customKeys.length + 1;
  const entCols = 4 + customKeys.length + 1;
  const pagCols = 4 + customKeys.length + 3;

  const recBg  = areaBg("rec",  isDark);
  const rendBg = areaBg("rend", isDark);
  const pagBg  = areaBg("pagos", isDark);
  const recTBg  = isDark ? AREA.rec.totalBg.dark  : AREA.rec.totalBg.light;
  const rendTBg = isDark ? AREA.rend.totalBg.dark : AREA.rend.totalBg.light;
  const pagTBg  = isDark ? AREA.pagos.totalBg.dark  : AREA.pagos.totalBg.light;
  const totBg   = isDark ? AREA.total.dark  : AREA.total.light;

  if (!rendiciones || rendiciones.length === 0) {
    return <div style={{ padding: "4rem", textAlign: "center", color: textMuted, fontSize: "0.9rem" }}>Sin datos para el período seleccionado.</div>;
  }

  return (
    <div style={{ overflowX: "auto", borderRadius: "16px", border, background: bg }}>
      <table style={{ borderCollapse: "collapse", width: "100%", color: isDark ? "#E5E7EB" : "#111" }}>
        <thead>
          {/* ── Fila 1: grupos ── */}
          <tr style={{ background: bgHeader }}>
            <HC style={{ borderRight: border, background: bgSummary, width: FECHA_W, minWidth: FECHA_W, maxWidth: FECHA_W, padding: "4px 2px" }} fontSize={9}>
              <div style={{ color: kpiOk ? "#16A34A" : "#DC2626", fontWeight: 900 }}>KPI {kpiGlobal}%</div>
              <div style={{ color: textMuted, fontWeight: 600, fontSize: "8px" }}>{sum.jornadas} jorn.</div>
            </HC>
            <HC colSpan={recCols}  style={{ background: recBg,  color: AREA.rec.text,  borderLeft: areaBorder("rec"),  borderRight: areaBorder("rend") }} fontSize={11}>Recepción</HC>
            <HC colSpan={entCols}  style={{ background: rendBg, color: AREA.rend.text, borderLeft: areaBorder("rend"), borderRight: areaBorder("pagos") }} fontSize={11}>Rendición</HC>
            <HC colSpan={pagCols}  style={{ background: pagBg,  color: AREA.pagos.text, borderLeft: areaBorder("pagos") }} fontSize={11}>Pagos</HC>
          </tr>
          {/* ── Fila 2: sub-columnas ── */}
          <tr style={{ background: bgHeader, borderBottom: border }}>
            <HC style={{ borderRight: border, background: bgSummary }} fontSize={10} />
            {/* REC */}
            <HC style={{ background: recBg, color: AREA.rec.text, borderLeft: areaBorder("rec") }} fontSize={10}>CTE</HC>
            <HC style={{ background: recBg, color: AREA.rec.text }} fontSize={10}>EXT</HC>
            <HC style={{ background: recBg, color: AREA.rec.text }} fontSize={10}>COD</HC>
            <HC style={{ background: recBg, color: AREA.rec.text }} fontSize={10}>PxP</HC>
            {customKeys.map((k) => <HC key={`rh_${k}`} style={{ background: recBg, color: AREA.rec.text }} fontSize={10}>{k}</HC>)}
            <HC style={{ fontWeight: 900, background: recTBg, color: AREA.rec.text, borderRight: areaBorder("rend") }} fontSize={10}>Tot</HC>
            {/* REND */}
            <HC style={{ background: rendBg, color: AREA.rend.text, borderLeft: areaBorder("rend") }} fontSize={10}>CTE</HC>
            <HC style={{ background: rendBg, color: AREA.rend.text }} fontSize={10}>EXT</HC>
            <HC style={{ background: rendBg, color: AREA.rend.text }} fontSize={10}>COD</HC>
            <HC style={{ background: rendBg, color: AREA.rend.text }} fontSize={10}>PxP</HC>
            {customKeys.map((k) => <HC key={`eh_${k}`} style={{ background: rendBg, color: AREA.rend.text }} fontSize={10}>{k}</HC>)}
            <HC style={{ fontWeight: 900, background: rendTBg, color: AREA.rend.text, borderRight: areaBorder("pagos") }} fontSize={10}>Tot</HC>
            {/* PAGOS */}
            <HC style={{ background: pagBg, color: AREA.pagos.text, borderLeft: areaBorder("pagos") }} fontSize={10}>CTE</HC>
            <HC style={{ background: pagBg, color: AREA.pagos.text }} fontSize={10}>EXT</HC>
            <HC style={{ background: pagBg, color: AREA.pagos.text }} fontSize={10}>COD</HC>
            <HC style={{ background: pagBg, color: AREA.pagos.text }} fontSize={10}>PxP</HC>
            {customKeys.map((k) => <HC key={`ph_${k}`} style={{ background: pagBg, color: AREA.pagos.text }} fontSize={10}>{k}</HC>)}
            <HC style={{ background: pagTBg, color: AREA.pagos.text }} fontSize={10}>Sub</HC>
            <HC style={{ background: pagTBg, color: AREA.pagos.text }} fontSize={10}>IVA</HC>
            <HC style={{ fontWeight: 900, background: totBg, color: AREA.total.text }} fontSize={10}>Total</HC>
          </tr>
          {/* SUMMARY ROW */}
          <tr style={{ background: bgSummary, fontWeight: 800, borderBottom: `2px solid ${isDark ? "#333" : "#D1D5DB"}` }}>
            <td style={{ padding: "6px 4px", fontSize: "10px", fontWeight: 850, borderRight: border, whiteSpace: "nowrap", width: FECHA_W, minWidth: FECHA_W, textAlign: "center", color: isDark ? "#fff" : "#111", letterSpacing: "0.05em" }}>
              FECHA
            </td>
            <Num v={sum.rec_cte}  bold area="rec"  isFirst isDark={isDark} />
            <Num v={sum.rec_ext}  bold area="rec"  isDark={isDark} />
            <Num v={sum.rec_cod}  bold area="rec"  isDark={isDark} />
            <Num v={sum.rec_pxp}  bold area="rec"  isDark={isDark} />
            {customKeys.map((k) => <Num key={`rs_${k}`} v={sum.customRec[k]} bold area="rec"  isDark={isDark} />)}
            <Num v={sum.rec_total} bold area="rec"  isTotal isDark={isDark} />
            <Num v={sum.ent_cte}  bold area="rend" isFirst isDark={isDark} />
            <Num v={sum.ent_ext}  bold area="rend" isDark={isDark} />
            <Num v={sum.ent_cod}  bold area="rend" isDark={isDark} />
            <Num v={sum.ent_pxp}  bold area="rend" isDark={isDark} />
            {customKeys.map((k) => <Num key={`es_${k}`} v={sum.customEnt[k]} bold area="rend" isDark={isDark} />)}
            <Num v={sum.ent_total} bold area="rend" isTotal isDark={isDark} />
            <Pay v={sum.ing_cte} bold area="pagos" isFirst isDark={isDark} />
            <Pay v={sum.ing_ext} bold area="pagos" isDark={isDark} />
            <Pay v={sum.ing_cod} bold area="pagos" isDark={isDark} />
            <Pay v={sum.ing_pxp} bold area="pagos" isDark={isDark} />
            {customKeys.map((k) => <Pay key={`ps_${k}`} v={sum.customIng[k]} bold area="pagos" isDark={isDark} />)}
            <Pay v={sum.ing_total} bold area="pagos" isTotal isDark={isDark} />
            <Pay v={sum.iva} bold area="pagos" isTotal isDark={isDark} color={textMuted} />
            <Pay v={sum.total_con_iva} bold area="total" isTotal isDark={isDark} color="#B45309" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.fecha} style={{ background: i%2===0 ? bg : (isDark ? "#161616" : "#F9FAFB"), borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}` }}>
              {/* Fecha + KPI inline + Folio abajo */}
              <td style={{ padding: "5px 4px", whiteSpace: "nowrap", borderRight: border, width: FECHA_W, minWidth: FECHA_W, maxWidth: FECHA_W, verticalAlign: "top", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  <span style={{ fontSize: "9px", fontWeight: 700 }}>{fmtDate(r.fecha)}</span>
                  <span style={{ fontSize: "7px", fontWeight: 800, padding: "1px 3px", borderRadius: 4, background: r.kpiLogrado ? "#D1FAE5" : "#FEE2E2", color: r.kpiLogrado ? "#065F46" : "#991B1B", lineHeight: 1.2 }}>
                    {r.kpiLogrado ? "✓" : "✗"}
                  </span>
                </div>
                <div style={{ fontSize: "8px", color: textMuted, marginTop: 1 }}>F: —</div>
              </td>
              {/* REC */}
              <Num v={r.rec_cte} area="rec"  isFirst isDark={isDark} />
              <Num v={r.rec_ext} area="rec"  isDark={isDark} />
              <Num v={r.rec_cod} area="rec"  isDark={isDark} />
              <Num v={r.rec_pxp} area="rec"  isDark={isDark} />
              {customKeys.map((k) => <Num key={`rc_${k}_${i}`} v={r.customRec[k]} area="rec"  isDark={isDark} />)}
              <Num v={r.rec_total} bold area="rec"  isTotal isDark={isDark} />
              {/* REND */}
              <Num v={r.ent_cte} area="rend" isFirst isDark={isDark} />
              <Num v={r.ent_ext} area="rend" isDark={isDark} />
              <Num v={r.ent_cod} area="rend" isDark={isDark} />
              <Num v={r.ent_pxp} area="rend" isDark={isDark} />
              {customKeys.map((k) => <Num key={`ec_${k}_${i}`} v={r.customEnt[k]} area="rend" isDark={isDark} />)}
              <Num v={r.ent_total} bold area="rend" isTotal isDark={isDark} />
              {/* PAGOS */}
              <Pay v={r.ing_cte} area="pagos" isFirst isDark={isDark} />
              <Pay v={r.ing_ext} area="pagos" isDark={isDark} />
              <Pay v={r.ing_cod} area="pagos" isDark={isDark} />
              <Pay v={r.ing_pxp} area="pagos" isDark={isDark} />
              {customKeys.map((k) => <Pay key={`pc_${k}_${i}`} v={r.customIng[k]} area="pagos" isDark={isDark} />)}
              <Pay v={r.ing_total} bold area="pagos" isTotal isDark={isDark} />
              <Pay v={r.iva}       area="pagos" isTotal isDark={isDark} color={textMuted} />
              <Pay v={r.total_con_iva} bold area="total" isTotal isDark={isDark} color="#B45309" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
