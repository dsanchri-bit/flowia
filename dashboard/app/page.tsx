"use client";

import React, { useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ActiveView = "none" | "analisis" | "financiero" | "estrategia";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-ES").format(Number(value || 0));
};

const formatPercent = (value: number) => {
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))} %`;
};

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [activeView, setActiveView] = useState<ActiveView>("none");
  const [analisis, setAnalisis] = useState<any>(null);
  const [financiero, setFinanciero] = useState<any>(null);
  const [estrategia, setEstrategia] = useState<any>(null);

  const [pregunta, setPregunta] = useState("");
  const [respuestaChat, setRespuestaChat] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const abrirSelectorArchivo = () => {
    fileInputRef.current?.click();
  };

  const startLoading = (text: string) => {
    setLoading(true);
    setLoadingText(text);
    setError("");
  };

  const stopLoading = () => {
    setLoading(false);
    setLoadingText("");
  };

  const limpiarVistas = () => {
    setActiveView("none");
    setAnalisis(null);
    setFinanciero(null);
    setEstrategia(null);
    setRespuestaChat("");
  };

  const subirExcel = async () => {
    if (!file) {
      setMensaje("Primero selecciona un archivo Excel.");
      return;
    }

    startLoading("Subiendo y procesando Excel...");
    setMensaje("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload_excel", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Error subiendo el Excel");
      }

      setMensaje("Excel cargado correctamente.");
      limpiarVistas();
    } catch (err: any) {
      setMensaje("");
      setError(err.message || "Error subiendo el Excel");
    } finally {
      stopLoading();
    }
  };

  const cargarAnalisis = async () => {
    limpiarVistas();
    startLoading("Generando análisis general...");

    try {
      const res = await fetch("http://127.0.0.1:8000/analisis");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Error cargando análisis");
      }

      setAnalisis(json);
      setActiveView("analisis");
    } catch (err: any) {
      setError(err.message || "Error cargando análisis");
    } finally {
      stopLoading();
    }
  };

  const cargarFinanciero = async () => {
    limpiarVistas();
    startLoading("Generando análisis financiero...");

    try {
      const res = await fetch("http://127.0.0.1:8000/analisis_financiero");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Error cargando análisis financiero");
      }

      setFinanciero(json);
      setActiveView("financiero");
    } catch (err: any) {
      setError(err.message || "Error cargando análisis financiero");
    } finally {
      stopLoading();
    }
  };

  const cargarEstrategia = async () => {
    limpiarVistas();
    startLoading("Generando estrategia...");

    try {
      const res = await fetch("http://127.0.0.1:8000/estrategia");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Error generando estrategia");
      }

      setEstrategia(json);
      setActiveView("estrategia");
    } catch (err: any) {
      setError(err.message || "Error generando estrategia");
    } finally {
      stopLoading();
    }
  };

  const preguntar = async () => {
    if (!pregunta.trim()) {
      setError("Escribe una pregunta antes de enviarla.");
      return;
    }

    startLoading("Consultando a FlowIA...");

    try {
      const contexto =
        estrategia?.contexto ||
        analisis?.datos ||
        financiero?.kpis ||
        null;

      const res = await fetch("http://127.0.0.1:8000/estrategia/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta,
          contexto,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Error consultando a FlowIA");
      }

      setRespuestaChat(json.respuesta);
    } catch (err: any) {
      setError(err.message || "Error consultando a FlowIA");
    } finally {
      stopLoading();
    }
  };

  const exportarPDF = () => {
    startLoading("Generando PDF...");

    setTimeout(() => {
      window.open("http://127.0.0.1:8000/exportar_pdf", "_blank");
      stopLoading();
    }, 800);
  };

  const chartData =
    analisis?.kpis
      ? [
          {
            name: "Empresa",
            ingresos: analisis.kpis.total_ingresos || 0,
            gastos: analisis.kpis.total_gastos_operativos || 0,
            costeLaboral: analisis.kpis.coste_laboral_estimado || 0,
            beneficio: analisis.kpis.beneficio_estimado || 0,
          },
        ]
      : [];

  return (
    <main style={styles.page} translate="no">
      <div style={styles.backgroundShapes}></div>

      <div style={styles.container}>
        <h1 style={styles.title} translate="no" suppressHydrationWarning>
          FlowIA Intelligence
        </h1>
        <p style={styles.subtitle} translate="no" suppressHydrationWarning>
          Análisis empresarial inteligente con IA
        </p>

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.progressBarOuter}>
              <div style={styles.progressBarInner}></div>
            </div>
            <p style={styles.loadingText}>{loadingText}</p>
          </div>
        )}

        <section style={styles.card}>
          <h2>Subir Excel</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.length) {
                setFile(e.target.files[0]);
                setMensaje(`Archivo seleccionado: ${e.target.files[0].name}`);
              }
            }}
          />

          <div style={styles.buttonRow}>
            <button
              onClick={abrirSelectorArchivo}
              style={styles.buttonSecondary}
              disabled={loading}
            >
              Seleccionar Excel
            </button>

            <button
              onClick={subirExcel}
              style={styles.button}
              disabled={loading}
            >
              Subir Excel
            </button>
          </div>

          {file && <p style={styles.text}>Archivo actual: {file.name}</p>}
          {mensaje && <p style={styles.success}>{mensaje}</p>}
        </section>

        <section style={styles.card}>
          <h2>Módulos</h2>

          <div style={styles.buttonRow}>
            <button
              onClick={cargarAnalisis}
              style={styles.button}
              disabled={loading}
            >
              Análisis
            </button>

            <button
              onClick={cargarFinanciero}
              style={styles.button}
              disabled={loading}
            >
              Financiero
            </button>

            <button
              onClick={cargarEstrategia}
              style={styles.button}
              disabled={loading}
            >
              Estrategia
            </button>

            <button
              onClick={exportarPDF}
              style={styles.buttonSecondary}
              disabled={loading}
            >
              Exportar PDF
            </button>
          </div>
        </section>

        {error && <p style={styles.error}>{error}</p>}

        {activeView === "analisis" && analisis && (
          <section style={styles.cardResponse}>
            <h2>Análisis general</h2>

            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Ingresos</p>
                <h3 style={styles.kpiValue}>
                  {formatCurrency(analisis.kpis.total_ingresos)}
                </h3>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Gastos operativos</p>
                <h3 style={styles.kpiValue}>
                  {formatCurrency(analisis.kpis.total_gastos_operativos)}
                </h3>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Coste laboral</p>
                <h3 style={styles.kpiValue}>
                  {formatCurrency(analisis.kpis.coste_laboral_estimado)}
                </h3>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Beneficio estimado</p>
                <h3 style={styles.kpiValue}>
                  {formatCurrency(analisis.kpis.beneficio_estimado)}
                </h3>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Margen estimado</p>
                <h3 style={styles.kpiValue}>
                  {formatPercent(analisis.kpis.margen_estimado_pct)}
                </h3>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Empleados</p>
                <h3 style={styles.kpiValue}>
                  {formatNumber(analisis.kpis.total_empleados)}
                </h3>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Resumen económico</h3>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" />
                    <Bar dataKey="gastos" name="Gastos" />
                    <Bar dataKey="costeLaboral" name="Coste laboral" />
                    <Bar dataKey="beneficio" name="Beneficio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p style={styles.text}>{analisis.resumen_ejecutivo}</p>

            <h3>Interpretación</h3>
            <p style={styles.text}>{analisis.texto_ia}</p>
          </section>
        )}

        {activeView === "financiero" && financiero && (
          <section style={styles.cardResponse}>
            <h2>Análisis financiero</h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Concepto</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Media</th>
                </tr>
              </thead>
              <tbody>
                {financiero.tabla.map((row: any, i: number) => (
                  <tr key={i}>
                    <td style={styles.td}>{row.tipo}</td>
                    <td style={styles.td}>{row.columna}</td>
                    <td style={styles.td}>{formatCurrency(row.total)}</td>
                    <td style={styles.td}>
                      {row.media ? formatCurrency(row.media) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Lectura financiera</h3>
            <p style={styles.text}>{financiero.texto_ia}</p>
          </section>
        )}

        {activeView === "estrategia" && estrategia && (
          <section style={styles.cardResponse}>
            <h2>Estrategia</h2>
            <p style={styles.text}>{estrategia.estrategia_base}</p>
          </section>
        )}

        <section style={styles.cardResponse}>
          <h2>Preguntar a FlowIA</h2>

          <textarea
            placeholder="Ej: ¿Dónde deberíamos crecer primero?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            style={styles.textarea}
            disabled={loading}
          />

          <button
            onClick={preguntar}
            style={styles.button}
            disabled={loading}
          >
            Preguntar a FlowIA
          </button>

          {respuestaChat && (
            <div style={{ marginTop: 16 }}>
              <h4>Respuesta de FlowIA</h4>
              <p style={styles.text}>{respuestaChat}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b, #020617)",
    color: "white",
    padding: 40,
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  backgroundShapes: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `
      radial-gradient(circle at 20% 25%, rgba(59,130,246,0.18), transparent 35%),
      radial-gradient(circle at 80% 20%, rgba(16,185,129,0.16), transparent 35%),
      radial-gradient(circle at 50% 85%, rgba(168,85,247,0.14), transparent 35%)
    `,
    zIndex: 0,
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: 40,
    marginBottom: 5,
  },
  subtitle: {
    color: "#cbd5e1",
    marginBottom: 30,
  },
  card: {
    background: "rgba(17, 24, 39, 0.88)",
    backdropFilter: "blur(10px)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  cardResponse: {
    background: "#374151",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  chartCard: {
    background: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    border: "1px solid #1f2937",
  },
  chartTitle: {
    marginTop: 0,
    marginBottom: 12,
    color: "#e5e7eb",
  },
  loadingCard: {
    background: "rgba(17, 24, 39, 0.88)",
    backdropFilter: "blur(10px)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  progressBarOuter: {
    width: "100%",
    height: 12,
    background: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
  },
  progressBarInner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #2563eb, #0f766e, #8b5cf6)",
    animation: "flowiaBar 1.6s infinite ease-in-out",
  },
  loadingText: {
    marginTop: 10,
    color: "#e5e7eb",
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 15px",
    background: "#2563eb",
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: 8,
  },
  buttonSecondary: {
    padding: "10px 15px",
    background: "#0f766e",
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: 8,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 15,
    marginBottom: 20,
  },
  kpiCard: {
    background: "#111827",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #1f2937",
  },
  kpiLabel: {
    margin: 0,
    color: "#9ca3af",
    fontSize: 14,
  },
  kpiValue: {
    margin: "10px 0 0 0",
    fontSize: 24,
    color: "#f9fafb",
  },
  table: {
    width: "100%",
    marginTop: 15,
    borderCollapse: "collapse",
    background: "#111827",
    borderRadius: 10,
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: 12,
    background: "#1f2937",
    color: "#93c5fd",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #1f2937",
  },
  text: {
    lineHeight: 1.7,
    marginTop: 10,
    whiteSpace: "pre-line",
    color: "#f3f4f6",
  },
  textarea: {
    width: "100%",
    height: 120,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#1f2937",
    border: "2px solid #0f766e",
    color: "white",
    outline: "none",
  },
  success: {
    color: "#34d399",
    marginTop: 10,
  },
  error: {
    color: "#f87171",
    marginBottom: 20,
  },
};