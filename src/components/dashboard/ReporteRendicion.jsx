import React, { useRef } from "react";
import { Printer } from "lucide-react";

/**
 * ReporteRendicion
 * Props:
 *  - profile      { nombre, region_asignada }
 *  - cuenta       { empresa?, movil?, ... tarifas_custom }
 *  - rendiciones  aggregated rows from DashboardHome (same as chartData source)
 *  - dateRange    { from, to }
 *  - theme        ThemeContext value
 *  - isDark       boolean
 */
export const triggerPrintHTML = (htmlContent) => {
  if (!htmlContent) return;
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Reporte de Rendición</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #111; padding: 6mm 8mm; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th { background: #f3f4f6; font-size: 7pt; font-weight: 800; text-transform: uppercase; padding: 3px 5px; border: 1px solid #d1d5db; text-align: center; }
        td { font-size: 8pt; padding: 2px 5px; border-bottom: 1px solid #e5e7eb; text-align: center; }
        td:first-child, th:first-child { text-align: left; }
        .ent { color: #1d4ed8; font-weight: 700; }
        .total-row td { font-weight: 900; border-top: 2px solid #d1d5db; }
        .summary { margin-top: 8px; display: flex; gap: 24px; }
        .summary-item p:first-child { font-size: 7pt; color: #6b7280; text-transform: uppercase; font-weight: 700; }
        .summary-item p:last-child { font-size: 14pt; font-weight: 900; }
        .dev { color: #dc2626; }
        h2 { font-size: 11pt; font-weight: 900; margin-bottom: 4px; }
        .meta { display: grid; grid-template-columns: repeat(3,1fr); gap: 3px 12px; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
        .meta .label { font-size: 6.5pt; color: #6b7280; }
        .meta .value { font-size: 8pt; font-weight: 700; }
        .sunday-row { opacity: 0.35; }
        tfoot { display: table-row-group; page-break-inside: avoid; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        @page { size: A4 portrait; margin: 6mm 8mm; }
      </style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
};

export default function ReporteRendicion({ profile, cuenta, rendiciones, dateRange, theme, isDark, hidePrintButton, sortOrder }) {
  const reportRef = useRef(null);

  // ── helpers ───────────────────────────────────────────────────────────────
  const parseTarifasCustom = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value || "[]"); } catch { return []; }
  };

  const tarifasCustom = parseTarifasCustom(cuenta?.tarifas_custom);

  // Custom type keys present across ALL rendition rows
  const customKeys = Array.from(
    new Set(
      rendiciones.flatMap(r =>
        r.datos_custom ? Object.keys(
          typeof r.datos_custom === "string"
            ? JSON.parse(r.datos_custom || "{}")
            : r.datos_custom
        ) : []
      )
    )
  );

  const getCustomLabel = (key) => {
    const match = tarifasCustom.find(t => t.nombre === key || t.label === key);
    return match?.label || match?.nombre || key;
  };

  const getCustomData = (r, key) => {
    const dc = typeof r.datos_custom === "string"
      ? JSON.parse(r.datos_custom || "{}")
      : (r.datos_custom || {});
    return dc[key] || { rec: 0, ent: 0, dev: 0 };
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = (dateStr || "").split("T")[0].split("-");
    if (!year || !month || !day) return dateStr;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  const isSunday = (dateStr) => {
    const [year, month, day] = (dateStr || "").split("T")[0].split("-");
    if (!year) return false;
    return new Date(year, month - 1, day).getDay() === 0;
  };

  // ── totals ────────────────────────────────────────────────────────────────
  const totals = rendiciones.reduce((acc, r) => {
    acc.rec_nac += (r.rec_cte || 0) + (r.rec_pxp || 0) + (r.rec_cod || 0);
    acc.ent_nac += (r.ent_cte || 0) + (r.ent_pxp || 0) + (r.ent_cod || 0);
    acc.rec_ext += (r.rec_ext || 0);
    acc.ent_ext += (r.ent_ext || 0);
    customKeys.forEach(k => {
      const d = getCustomData(r, k);
      if (!acc.custom[k]) acc.custom[k] = { rec: 0, ent: 0 };
      acc.custom[k].rec += d.rec || 0;
      acc.custom[k].ent += d.ent || 0;
    });
    acc.rec_total += (r.rec_cte || 0) + (r.rec_pxp || 0) + (r.rec_cod || 0)
      + (r.rec_ext || 0)
      + customKeys.reduce((s, k) => s + (getCustomData(r, k).rec || 0), 0);
    acc.ent_total += (r.ent_cte || 0) + (r.ent_pxp || 0) + (r.ent_cod || 0)
      + (r.ent_ext || 0)
      + customKeys.reduce((s, k) => s + (getCustomData(r, k).ent || 0), 0);
    return acc;
  }, { rec_nac: 0, ent_nac: 0, rec_ext: 0, ent_ext: 0, custom: {}, rec_total: 0, ent_total: 0 });

  // ── print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    triggerPrintHTML(reportRef.current?.innerHTML);
  };

  // ── empresa / movil / ruta parsing ─────────────────────────────────────────
  const empresa = cuenta?.nombre_empresa || cuenta?.empresa || "—";
  
  // Extrae RUTA y MÓVIL desde region_asignada (Ej: "MachaliMovil60900")
  const rawRegion = profile?.region_asignada || "";
  const matchRutaMovil = rawRegion.match(/^(.*?)(?:Movil(\d+))?$/i);
  
  const ruta  = matchRutaMovil?.[1] ? matchRutaMovil[1].toUpperCase() : (rawRegion || "—");
  const movil = matchRutaMovil?.[2] || cuenta?.movil || "—";
  
  const tripulacion = profile?.nombre || "—";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Toolbar */}
      {!hidePrintButton && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "12px",
              border: "none",
              backgroundColor: theme.primary,
              color: "#000",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: `0 4px 14px -4px ${theme.primary}99`,
            }}
          >
            <Printer size={16} />
            Generar PDF / Imprimir
          </button>
        </div>
      )}

      {/* Report preview card */}
      <div
        ref={reportRef}
        style={{
          backgroundColor: isDark ? "#111" : "#fff",
          border: `1px solid ${theme.border}`,
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <ReportContent
          empresa={empresa}
          tripulacion={tripulacion}
          movil={movil}
          ruta={ruta}
          dateRange={dateRange}
          rendiciones={rendiciones}
          customKeys={customKeys}
          getCustomLabel={getCustomLabel}
          getCustomData={getCustomData}
          formatDate={formatDate}
          isSunday={isSunday}
          totals={totals}
          theme={theme}
          isDark={isDark}
          sortOrder={sortOrder}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure presentational component — shared between screen preview and print clone
// ─────────────────────────────────────────────────────────────────────────────
function ReportContent({
  empresa, tripulacion, movil, ruta, dateRange,
  rendiciones, customKeys, getCustomLabel, getCustomData,
  formatDate, isSunday, totals,
  theme, isDark, printMode = false, sortOrder = 'desc',
}) {
  const cell = {
    padding: printMode ? "2px 5px" : "3px 6px",
    fontSize: printMode ? "8pt" : "0.7rem",
    textAlign: "center",
    borderBottom: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
    whiteSpace: "nowrap",
  };
  const headerCell = {
    ...cell,
    fontWeight: 800,
    fontSize: printMode ? "7pt" : "0.6rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6",
    color: isDark ? "#aaa" : "#374151",
    padding: printMode ? "3px 5px" : "4px 6px",
  };

  const labelStyle = {
    fontSize: printMode ? "9pt" : "0.75rem",
    color: isDark ? "#aaa" : "#6b7280",
    margin: 0,
  };
  const valueStyle = {
    fontSize: printMode ? "10pt" : "0.85rem",
    fontWeight: 700,
    color: isDark ? "#fff" : "#111",
    margin: 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: printMode ? "0.3rem" : "0.75rem", borderBottom: `2px solid ${isDark ? "#333" : "#e5e7eb"}`, paddingBottom: printMode ? "0.3rem" : "0.6rem" }}>
        <h2 style={{ margin: printMode ? "0 0 0.2rem" : "0 0 0.5rem", fontSize: printMode ? "11pt" : "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: isDark ? "#fff" : "#111" }}>
          Reporte de Rendición Diaria
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: printMode ? "0.15rem 1rem" : "0.5rem 1.5rem" }}>
          <div>
            <p style={labelStyle}>EMPRESA</p>
            <p style={valueStyle}>{empresa}</p>
          </div>
          <div>
            <p style={labelStyle}>TRIPULACIÓN</p>
            <p style={valueStyle}>{tripulacion}</p>
          </div>
          <div>
            <p style={labelStyle}>MÓVIL</p>
            <p style={valueStyle}>{movil}</p>
          </div>
          <div>
            <p style={labelStyle}>RUTA</p>
            <p style={valueStyle}>{ruta}</p>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <p style={labelStyle}>PERÍODO</p>
            <p style={valueStyle}>del {dateRange.from} al {dateRange.to}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: printMode ? "9pt" : "inherit" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...headerCell, textAlign: "left", minWidth: "90px" }}>Fecha</th>
              <th
                colSpan={2 + customKeys.length + 1}
                style={{ ...headerCell, textAlign: "center", borderBottom: "none" }}
              >
                Nro. De Enc. Entregadas
              </th>
              <th rowSpan={2} style={{ ...headerCell, textAlign: "center", minWidth: "60px" }}>Folio de Rendición</th>
            </tr>
            <tr>
              <th style={{ ...headerCell, textAlign: "center" }}>Nacionales</th>
              <th style={{ ...headerCell, textAlign: "center" }}>EXT</th>
              {customKeys.map(k => (
                <th key={k} style={{ ...headerCell, textAlign: "center" }}>{getCustomLabel(k)}</th>
              ))}
              <th style={{ ...headerCell, textAlign: "center" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(rendiciones || []).slice().sort((a, b) => {
              const cmp = String(a.fecha).localeCompare(String(b.fecha));
              return sortOrder === 'desc' ? -cmp : cmp;
            }).map((r, i) => {
              const sunday = isSunday(r.fecha);
              const rec_nac = (r.rec_cte || 0) + (r.rec_pxp || 0) + (r.rec_cod || 0);
              const ent_nac = (r.ent_cte || 0) + (r.ent_pxp || 0) + (r.ent_cod || 0);
              const rec_ext = r.rec_ext || 0;
              const ent_ext = r.ent_ext || 0;
              const rec_custom_total = customKeys.reduce((s, k) => s + (getCustomData(r, k).rec || 0), 0);
              const ent_custom_total = customKeys.reduce((s, k) => s + (getCustomData(r, k).ent || 0), 0);
              const rec_total = rec_nac + rec_ext + rec_custom_total;
              const ent_total = ent_nac + ent_ext + ent_custom_total;

              const rowStyle = {
                opacity: sunday ? 0.35 : 1,
                backgroundColor: i % 2 === 0
                  ? (isDark ? "transparent" : "#fafafa")
                  : (isDark ? "#0d0d0d" : "#fff"),
              };

              return (
                <tr key={r.fecha} style={rowStyle}>
                  <td style={{ ...cell, textAlign: "left", fontWeight: 700, color: isDark ? "#ddd" : "#111" }}>
                    {formatDate(r.fecha)}
                  </td>
                  <td style={{ ...cell, color: isDark ? "#aef" : "#1d4ed8", fontWeight: 700 }}>{ent_nac ?? 0}</td>
                  <td style={{ ...cell, color: isDark ? "#aef" : "#1d4ed8", fontWeight: 700 }}>{ent_ext ?? 0}</td>
                  {customKeys.map(k => {
                    const cd = getCustomData(r, k);
                    return (
                      <td key={k} style={{ ...cell, color: isDark ? "#aef" : "#1d4ed8", fontWeight: 700 }}>{cd.ent ?? 0}</td>
                    );
                  })}
                  <td style={{ ...cell, fontWeight: 950, fontSize: "1.05rem", color: isDark ? "#aef" : "#1d4ed8", backgroundColor: isDark ? "rgba(29, 78, 216, 0.15)" : "#eff6ff" }}>{ent_total ?? 0}</td>
                  <td style={{ ...cell, color: isDark ? "#aaa" : "#4b5563", fontSize: "0.7rem", fontWeight: 600 }}>{r.folio || "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${isDark ? "#444" : "#d1d5db"}` }}>
              <td style={{ ...cell, textAlign: "left", fontWeight: 900 }}>TOTAL</td>
              <td style={{ ...cell, fontWeight: 900 }}>{totals.ent_nac}</td>
              <td style={{ ...cell, fontWeight: 900 }}>{totals.ent_ext}</td>
              {customKeys.map(k => (
                <td key={k} style={{ ...cell, fontWeight: 900 }}>{totals.custom[k]?.ent || 0}</td>
              ))}
              <td style={{ ...cell, fontWeight: 900 }}>{totals.ent_total}</td>
              <td style={cell}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary footer */}
      <div style={{ marginTop: "1.25rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: printMode ? "8pt" : "0.65rem", color: isDark ? "#888" : "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Jornadas</p>
          <p style={{ margin: 0, fontSize: printMode ? "14pt" : "1.4rem", fontWeight: 900, color: isDark ? "#fff" : "#111" }}>{rendiciones.length}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: printMode ? "8pt" : "0.65rem", color: isDark ? "#888" : "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Total Rec</p>
          <p style={{ margin: 0, fontSize: printMode ? "14pt" : "1.4rem", fontWeight: 900, color: isDark ? "#fff" : "#111" }}>{totals.rec_total}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: printMode ? "8pt" : "0.65rem", color: isDark ? "#888" : "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Total Ent</p>
          <p style={{ margin: 0, fontSize: printMode ? "14pt" : "1.4rem", fontWeight: 900, color: isDark ? "#6ef" : "#1d4ed8" }}>{totals.ent_total}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: printMode ? "8pt" : "0.65rem", color: isDark ? "#888" : "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Devueltas</p>
          <p style={{ margin: 0, fontSize: printMode ? "14pt" : "1.4rem", fontWeight: 900, color: isDark ? "#f87" : "#dc2626" }}>{Math.max(0, totals.rec_total - totals.ent_total)}</p>
        </div>
      </div>
    </div>
  );
}
