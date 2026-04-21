"use client";

import React, { useMemo, useRef, useState } from "react";
import BackgroundParticles from "./components/Background";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

type ActiveView = "none" | "analisis" | "financiero" | "estrategia";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://flowia-backend-ltm1.onrender.com";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
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

const isNegative = (value: number) => Number(value || 0) < 0;

const getRiskLevel = (margin: number, beneficio: number) => {
  if (beneficio < 0 || margin < 0) return "ALTO";
  if (margin < 10) return "MEDIO";
  return "CONTROLADO";
};

const cleanMarkdownText = (text: string = "") => {
  return text
    .replace(/\*\*/g, "")
    .replace(/###/g, "")
    .replace(/##/g, "")
    .replace(/---/g, "")
    .trim();
};

const splitParagraphs = (text: string = "") => {
  return cleanMarkdownText(text)
    .split(/\n\s*\n|\n(?=\d+\.)/)
    .map((block) => block.trim())
    .filter(Boolean);
};

const extractBullets = (text: string = "") => {
  return cleanMarkdownText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith("-") ||
        line.startsWith("•") ||
        /^\d+\./.test(line) ||
        line.includes(":")
    )
    .slice(0, 8);
};

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={styles.sectionHeader}>
      {eyebrow ? <p style={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 style={styles.sectionTitle}>{title}</h2>
      {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
}) {
  const toneStyle =
    tone === "danger"
      ? styles.badgeDanger
      : tone === "warning"
      ? styles.badgeWarning
      : tone === "success"
      ? styles.badgeSuccess
      : styles.badgeNeutral;

  return <span style={{ ...styles.badgeBase, ...toneStyle }}>{label}</span>;
}

function KPICard({
  label,
  value,
  highlight = "neutral",
  helpText,
}: {
  label: string;
  value: string;
  highlight?: "neutral" | "danger" | "success";
  helpText?: string;
}) {
  const valueStyle =
    highlight === "danger"
      ? styles.kpiValueDanger
      : highlight === "success"
      ? styles.kpiValueSuccess
      : styles.kpiValue;

  return (
    <div style={styles.kpiCard}>
      <p style={styles.kpiLabel}>{label}</p>
      <h3 style={valueStyle}>{value}</h3>
      {helpText ? <p style={styles.kpiHelp}>{helpText}</p> : null}
    </div>
  );
}

function InfoBlock({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "danger" | "success";
}) {
  const blockStyle =
    tone === "danger"
      ? styles.infoBlockDanger
      : tone === "success"
      ? styles.infoBlockSuccess
      : styles.infoBlock;

  return (
    <div style={blockStyle}>
      <h4 style={styles.infoBlockTitle}>{title}</h4>
      <ul style={styles.list}>
        {items.map((item, index) => (
          <li key={`${title}-${index}`} style={styles.listItem}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RenderRichText({ text }: { text: string }) {
  const paragraphs = splitParagraphs(text);

  if (!paragraphs.length) return null;

  return (
    <div style={styles.richText}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={styles.text}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

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
      const res = await fetch(`${API_URL}/upload_excel`, {
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
      const res = await fetch(`${API_URL}/analisis`);
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
      const res = await fetch(`${API_URL}/analisis_financiero`);
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
      const res = await fetch(`${API_URL}/estrategia`);
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
        estrategia?.contexto || analisis?.datos || financiero?.kpis || null;

      const res = await fetch(`${API_URL}/estrategia/chat`, {
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
      window.open(`${API_URL}/exportar_pdf`, "_blank");
      stopLoading();
    }, 800);
  };

  const analisisKpis = analisis?.kpis || null;
  const ingresos = Number(analisisKpis?.total_ingresos || 0);
  const gastos = Number(analisisKpis?.total_gastos_operativos || 0);
  const costeLaboral = Number(analisisKpis?.coste_laboral_estimado || 0);
  const beneficio = Number(analisisKpis?.beneficio_estimado || 0);
  const margen = Number(analisisKpis?.margen_estimado_pct || 0);
  const empleados = Number(analisisKpis?.total_empleados || 0);
  const costesTotales = gastos + costeLaboral;
  const ratioCostesIngresos = ingresos > 0 ? costesTotales / ingresos : 0;
  const ratioCosteLaboralIngresos = ingresos > 0 ? costeLaboral / ingresos : 0;
  const riskLevel = getRiskLevel(margen, beneficio);

  const diagnosticTone =
    riskLevel === "ALTO"
      ? "danger"
      : riskLevel === "MEDIO"
      ? "warning"
      : "success";

  const analisisBullets = useMemo(() => {
    if (!analisisKpis) return [];
    return [
      `La empresa presenta un beneficio estimado de ${formatCurrency(
        beneficio
      )}.`,
      `El coste laboral asciende a ${formatCurrency(
        costeLaboral
      )} y supone ${new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(ratioCosteLaboralIngresos * 100)}% de los ingresos.`,
      `Los costes totales equivalen a ${new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(ratioCostesIngresos * 100)}% de la facturación.`,
      `La estructura actual de ${formatNumber(
        empleados
      )} empleados no está alineada con el nivel actual de ingresos.`,
    ];
  }, [analisisKpis, beneficio, costeLaboral, ratioCosteLaboralIngresos, ratioCostesIngresos, empleados]);

  const accionesAnalisis = [
    "Revisar la dimensión de la plantilla y la distribución de carga de trabajo.",
    "Priorizar servicios y clientes con mayor margen bruto.",
    "Analizar pricing, descuentos y contratos de bajo rendimiento.",
    "Reducir costes operativos no críticos y automatizar tareas repetitivas.",
  ];

  const estrategiaBullets = useMemo(
    () => extractBullets(estrategia?.estrategia_base || ""),
    [estrategia]
  );

  const chatBullets = useMemo(
    () => extractBullets(respuestaChat || ""),
    [respuestaChat]
  );

  const chartData = [
    {
      name: "Ingresos",
      valor: ingresos,
    },
    {
      name: "Gastos operativos",
      valor: gastos,
    },
    {
      name: "Coste laboral",
      valor: costeLaboral,
    },
    {
      name: "Beneficio",
      valor: beneficio,
    },
  ];

  return (
    <main style={styles.page} translate="no">
      <BackgroundParticles />
    
      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <div style={styles.heroBadge}>FlowIA Intelligence</div>
            <h1 style={styles.title} translate="no" suppressHydrationWarning>
              Sistema multiagente para análisis empresarial
            </h1>
            <p
              style={styles.subtitle}
              translate="no"
              suppressHydrationWarning
            >
              Analiza datos financieros, detecta riesgos y propone acciones
              estratégicas con una experiencia más clara, ejecutiva y lista para
              demo.
            </p>

            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <span style={styles.heroStatLabel}>Módulos</span>
                <strong style={styles.heroStatValue}>3</strong>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatLabel}>IA aplicada</span>
                <strong style={styles.heroStatValue}>Análisis + Estrategia</strong>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatLabel}>Salida</span>
                <strong style={styles.heroStatValue}>Diagnóstico ejecutivo</strong>
              </div>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.sidePanel}>
              <p style={styles.sidePanelEyebrow}>Capacidades</p>
              <ul style={styles.sideList}>
                <li>Subida de Excel</li>
                <li>Análisis general</li>
                <li>Lectura financiera</li>
                <li>Estrategia de negocio</li>
                <li>Consulta contextual con IA</li>
                <li>Exportación PDF</li>
              </ul>
            </div>
          </div>
        </section>

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.progressBarOuter}>
              <div style={styles.progressBarInner}></div>
            </div>
            <p style={styles.loadingText}>{loadingText}</p>
          </div>
        )}

        <div style={styles.topGrid}>
          <section style={styles.card}>
            <SectionHeader
              eyebrow="Entrada de datos"
              title="Subir Excel"
              subtitle="Carga el archivo base para procesar la información empresarial."
            />

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
                style={styles.buttonPrimary}
                disabled={loading}
              >
                Subir Excel
              </button>
            </div>

            {file && (
              <div style={styles.fileTag}>
                <span style={styles.fileTagLabel}>Archivo actual</span>
                <strong>{file.name}</strong>
              </div>
            )}

            {mensaje && <p style={styles.success}>{mensaje}</p>}
          </section>

          <section style={styles.card}>
            <SectionHeader
              eyebrow="Motor de análisis"
              title="Módulos"
              subtitle="Ejecuta el flujo principal de FlowIA y muestra cada bloque por separado."
            />

            <div style={styles.buttonRow}>
              <button
                onClick={cargarAnalisis}
                style={styles.buttonPrimary}
                disabled={loading}
              >
                Análisis
              </button>

              <button
                onClick={cargarFinanciero}
                style={styles.buttonPrimary}
                disabled={loading}
              >
                Financiero
              </button>

              <button
                onClick={cargarEstrategia}
                style={styles.buttonPrimary}
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

            <div style={styles.moduleLegend}>
              <span style={styles.moduleChip}>Análisis</span>
              <span style={styles.moduleChip}>Financiero</span>
              <span style={styles.moduleChip}>Estrategia</span>
              <span style={styles.moduleChip}>Consulta IA</span>
            </div>
          </section>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {activeView === "analisis" && analisis && (
          <section style={styles.cardResponse}>
            <SectionHeader
              eyebrow="Módulo 1"
              title="Análisis general"
              subtitle="Diagnóstico automático del estado económico de la empresa."
            />

            <div style={styles.alertCard}>
              <div style={styles.alertHeader}>
                <div>
                  <p style={styles.alertEyebrow}>Diagnóstico automático</p>
                  <h3 style={styles.alertTitle}>
                    {beneficio < 0
                      ? "La empresa presenta pérdidas estructurales graves"
                      : "La empresa mantiene una situación operativa positiva"}
                  </h3>
                </div>

                <StatusBadge
                  label={`Riesgo ${riskLevel}`}
                  tone={diagnosticTone}
                />
              </div>

              <p style={styles.alertText}>
                {beneficio < 0
                  ? `La combinación de costes operativos y coste laboral supera ampliamente los ingresos. El margen actual (${formatPercent(
                      margen
                    )}) refleja una estructura de costes no sostenible.`
                  : `Los ingresos permiten cubrir la estructura actual, aunque conviene seguir monitorizando el margen y la eficiencia operativa.`}
              </p>
            </div>

            <div style={styles.kpiGrid}>
              <KPICard
                label="Ingresos"
                value={formatCurrency(ingresos)}
                highlight="success"
              />
              <KPICard
                label="Gastos operativos"
                value={formatCurrency(gastos)}
              />
              <KPICard
                label="Coste laboral"
                value={formatCurrency(costeLaboral)}
                highlight={ratioCosteLaboralIngresos > 1 ? "danger" : "neutral"}
                helpText="Principal foco de presión sobre la rentabilidad."
              />
              <KPICard
                label="Beneficio estimado"
                value={formatCurrency(beneficio)}
                highlight={isNegative(beneficio) ? "danger" : "success"}
              />
              <KPICard
                label="Margen estimado"
                value={formatPercent(margen)}
                highlight={isNegative(margen) ? "danger" : "success"}
              />
              <KPICard
                label="Empleados"
                value={formatNumber(empleados)}
              />
            </div>

            <div style={styles.twoColumn}>
              <InfoBlock
                title="Insights clave"
                items={analisisBullets}
                tone="danger"
              />
              <InfoBlock
                title="Acciones recomendadas"
                items={accionesAnalisis}
                tone="success"
              />
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div>
                  <h3 style={styles.chartTitle}>Comparativa económica</h3>
                  <p style={styles.chartSubtitle}>
                    Lectura rápida de ingresos frente a costes y beneficio.
                  </p>
                </div>

                <div style={styles.metricPill}>
                  Costes / Ingresos:{" "}
                  <strong>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }).format(ratioCostesIngresos)}x
                  </strong>
                </div>
              </div>

              <div style={{ width: "100%", height: 330 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={{ stroke: "#334155" }}
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={{ stroke: "#334155" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                      formatter={(value: any) =>
                        formatCurrency(Number(value || 0))
                      }
                    />
                    <Legend />
                    <Bar dataKey="valor" name="Valor">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Ingresos"
                              ? "#22c55e"
                              : entry.name === "Beneficio" && entry.valor < 0
                              ? "#ef4444"
                              : "#3b82f6"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.contentCard}>
              <h3 style={styles.contentTitle}>Resumen ejecutivo</h3>
              <RenderRichText text={analisis.resumen_ejecutivo} />
            </div>

            <div style={styles.contentCard}>
              <div style={styles.contentHeader}>
                <h3 style={styles.contentTitle}>Interpretación</h3>
                <StatusBadge label="Gemini" tone="neutral" />
              </div>
              <RenderRichText text={analisis.texto_ia} />
            </div>

            <div style={styles.agentBar}>
              <span style={styles.agentLabel}>Análisis generado por:</span>
              <span style={styles.agentChip}>Agente Financiero</span>
              <span style={styles.agentChip}>Agente Estratégico</span>
              <span style={styles.agentChip}>Gemini</span>
            </div>
          </section>
        )}

        {activeView === "financiero" && financiero && (
          <section style={styles.cardResponse}>
            <SectionHeader
              eyebrow="Módulo 2"
              title="Análisis financiero"
              subtitle="Lectura estructurada de ingresos, gastos, margen y beneficio."
            />

            <div style={styles.tableWrap}>
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
                  {financiero.tabla.map((row: any, i: number) => {
                    const total = Number(row.total || 0);
                    const isCritical =
                      row.tipo?.toLowerCase().includes("beneficio") ||
                      row.tipo?.toLowerCase().includes("margen");

                    return (
                      <tr key={i}>
                        <td style={styles.tdStrong}>{row.tipo}</td>
                        <td style={styles.tdMuted}>{row.columna}</td>
                        <td
                          style={{
                            ...styles.td,
                            ...(isCritical && total < 0
                              ? styles.negativeText
                              : {}),
                          }}
                        >
                          {formatCurrency(total)}
                        </td>
                        <td style={styles.td}>
                          {row.media ? formatCurrency(row.media) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={styles.contentCard}>
              <div style={styles.contentHeader}>
                <h3 style={styles.contentTitle}>Lectura financiera</h3>
                <StatusBadge label="OpenAI" tone="neutral" />
              </div>
              <RenderRichText text={financiero.texto_ia} />
            </div>
          </section>
        )}

        {activeView === "estrategia" && estrategia && (
          <section style={styles.cardResponse}>
            <SectionHeader
              eyebrow="Módulo 3"
              title="Estrategia"
              subtitle="Recomendaciones de actuación orientadas a rentabilidad, eficiencia y crecimiento."
            />

            {estrategiaBullets.length > 0 && (
              <div style={styles.twoColumn}>
                <InfoBlock
                  title="Palancas estratégicas"
                  items={estrategiaBullets.slice(0, 4)}
                />
                <InfoBlock
                  title="Líneas de acción"
                  items={estrategiaBullets.slice(4, 8).length ? estrategiaBullets.slice(4, 8) : [
                    "Revisar cartera de servicios y rentabilidad por línea de negocio.",
                    "Alinear recursos con actividades de mayor valor.",
                    "Mejorar pricing y condiciones comerciales.",
                    "Explorar nuevos nichos y geografías con mejor margen."
                  ]}
                  tone="success"
                />
              </div>
            )}

            <div style={styles.contentCard}>
              <h3 style={styles.contentTitle}>Plan estratégico detallado</h3>
              <RenderRichText text={estrategia.estrategia_base} />
            </div>

            <div style={styles.agentBar}>
              <span style={styles.agentLabel}>Análisis generado por:</span>
              <span style={styles.agentChip}>Agente Estratégico</span>
              <span style={styles.agentChip}>Contexto empresarial</span>
              <span style={styles.agentChip}>IA generativa</span>
            </div>
          </section>
        )}

        <section style={styles.cardResponse}>
          <SectionHeader
            eyebrow="Asistente contextual"
            title="Preguntar a FlowIA"
            subtitle="Haz preguntas sobre crecimiento, rentabilidad, eficiencia o nuevos nichos de mercado."
          />

          <textarea
            placeholder="Ej: ¿Dónde deberíamos crecer primero?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            style={styles.textarea}
            disabled={loading}
          />

          <div style={styles.buttonRow}>
            <button
              onClick={preguntar}
              style={styles.buttonPrimary}
              disabled={loading}
            >
              Preguntar a FlowIA
            </button>
          </div>

          {respuestaChat && (
            <div style={styles.chatResponseCard}>
              <div style={styles.contentHeader}>
                <h4 style={styles.chatTitle}>Respuesta de FlowIA</h4>
                <StatusBadge label="Consulta IA" tone="neutral" />
              </div>

              {chatBullets.length > 0 && (
                <div style={styles.infoBlock}>
                  <h4 style={styles.infoBlockTitle}>Puntos destacados</h4>
                  <ul style={styles.list}>
                    {chatBullets.map((item, index) => (
                      <li key={index} style={styles.listItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <RenderRichText text={respuestaChat} />
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
  background:
    "radial-gradient(circle at top left, #1e3a8a 0%, transparent 25%), radial-gradient(circle at top right, rgba(16,185,129,0.16) 0%, transparent 22%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
  color: "white",
  padding: "32px 20px 60px",
  fontFamily:
    "Inter, Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  position: "relative",
  zIndex: 1,
  overflow: "hidden",
},
  backgroundShapes: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18), transparent 28%),
      radial-gradient(circle at 85% 15%, rgba(16,185,129,0.16), transparent 26%),
      radial-gradient(circle at 50% 100%, rgba(168,85,247,0.10), transparent 28%)
    `,
    zIndex: 0,
    pointerEvents: "none",
  },
  container: {
  maxWidth: 1180,
  margin: "0 auto",
  position: "relative",
  zIndex: 2,
},
  heroCard: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr",
    gap: 20,
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    backdropFilter: "blur(14px)",
    marginBottom: 22,
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroRight: {
    display: "flex",
    alignItems: "stretch",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.18)",
    color: "#bfdbfe",
    border: "1px solid rgba(96,165,250,0.25)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  title: {
    fontSize: 46,
    lineHeight: 1.05,
    margin: 0,
    marginBottom: 12,
    letterSpacing: -1.2,
  },
  subtitle: {
    color: "#cbd5e1",
    margin: 0,
    marginBottom: 24,
    lineHeight: 1.7,
    fontSize: 16,
    maxWidth: 760,
  },
  heroStats: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  heroStat: {
    minWidth: 150,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(15,23,42,0.75)",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  heroStatLabel: {
    display: "block",
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroStatValue: {
    color: "#f8fafc",
    fontSize: 15,
  },
  sidePanel: {
    width: "100%",
    background:
      "linear-gradient(180deg, rgba(30,41,59,0.82) 0%, rgba(15,23,42,0.88) 100%)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 20,
    padding: 20,
  },
  sidePanelEyebrow: {
    margin: 0,
    marginBottom: 14,
    color: "#93c5fd",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  sideList: {
    margin: 0,
    paddingLeft: 18,
    color: "#e2e8f0",
    lineHeight: 1.9,
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  card: {
    background: "rgba(15, 23, 42, 0.78)",
    backdropFilter: "blur(12px)",
    padding: 22,
    borderRadius: 22,
    marginBottom: 0,
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
  },
  cardResponse: {
    background: "rgba(51, 65, 85, 0.82)",
    backdropFilter: "blur(12px)",
    padding: 24,
    borderRadius: 22,
    marginBottom: 22,
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
  },
  sectionHeader: {
    marginBottom: 18,
  },
  eyebrow: {
    margin: 0,
    marginBottom: 8,
    color: "#93c5fd",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    color: "#f8fafc",
  },
  sectionSubtitle: {
    margin: 0,
    marginTop: 8,
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: 14,
  },
  loadingCard: {
    background: "rgba(15, 23, 42, 0.82)",
    backdropFilter: "blur(10px)",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    border: "1px solid rgba(148,163,184,0.12)",
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
    gap: 12,
    flexWrap: "wrap",
  },
buttonPrimary: {
   padding: "12px 18px",
   background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
   border: "none",
   color: "white",
   cursor: "pointer",
   borderRadius: 10,
   transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
   boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
   fontWeight: 600,
},
buttonSecondary: {
   padding: "12px 18px",
   background: "linear-gradient(135deg, #0f766e, #0d9488)",
   border: "none",
   color: "white",
   cursor: "pointer",
   borderRadius: 10,
   transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
   boxShadow: "0 4px 14px rgba(15,118,110,0.4)",
   fontWeight: 600,
},
  fileTag: {
    marginTop: 16,
    display: "inline-flex",
    flexDirection: "column",
    gap: 4,
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(15,23,42,0.65)",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  fileTagLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  moduleLegend: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  },
  moduleChip: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(30,41,59,0.85)",
    border: "1px solid rgba(148,163,184,0.12)",
    color: "#e2e8f0",
    fontSize: 13,
  },
  alertCard: {
    background:
      "linear-gradient(180deg, rgba(127,29,29,0.20) 0%, rgba(15,23,42,0.88) 100%)",
    border: "1px solid rgba(248,113,113,0.22)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  alertHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  alertEyebrow: {
    margin: 0,
    marginBottom: 8,
    color: "#fca5a5",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  alertTitle: {
    margin: 0,
    color: "#fff",
    fontSize: 24,
    lineHeight: 1.2,
  },
  alertText: {
    marginTop: 12,
    marginBottom: 0,
    color: "#e5e7eb",
    lineHeight: 1.7,
  },
  badgeBase: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  badgeDanger: {
    background: "rgba(239,68,68,0.16)",
    color: "#fca5a5",
    border: "1px solid rgba(248,113,113,0.22)",
  },
  badgeWarning: {
    background: "rgba(245,158,11,0.16)",
    color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.22)",
  },
  badgeSuccess: {
    background: "rgba(34,197,94,0.16)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.22)",
  },
  badgeNeutral: {
    background: "rgba(59,130,246,0.16)",
    color: "#bfdbfe",
    border: "1px solid rgba(96,165,250,0.22)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    background: "rgba(15,23,42,0.88)",
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.10)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  kpiLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  kpiValue: {
    margin: "12px 0 0 0",
    fontSize: 28,
    color: "#f8fafc",
    lineHeight: 1.1,
  },
  kpiValueDanger: {
    margin: "12px 0 0 0",
    fontSize: 28,
    color: "#f87171",
    lineHeight: 1.1,
  },
  kpiValueSuccess: {
    margin: "12px 0 0 0",
    fontSize: 28,
    color: "#4ade80",
    lineHeight: 1.1,
  },
  kpiHelp: {
    margin: "10px 0 0 0",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  infoBlock: {
    background: "rgba(15,23,42,0.74)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: 18,
    padding: 18,
  },
  infoBlockDanger: {
    background: "rgba(127,29,29,0.14)",
    border: "1px solid rgba(248,113,113,0.16)",
    borderRadius: 18,
    padding: 18,
  },
  infoBlockSuccess: {
    background: "rgba(6,95,70,0.18)",
    border: "1px solid rgba(52,211,153,0.16)",
    borderRadius: 18,
    padding: 18,
  },
  infoBlockTitle: {
    margin: 0,
    marginBottom: 12,
    fontSize: 16,
    color: "#f8fafc",
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    color: "#e5e7eb",
    lineHeight: 1.8,
  },
  listItem: {
    marginBottom: 6,
  },
  chartCard: {
    background: "rgba(15,23,42,0.90)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    border: "1px solid rgba(148,163,184,0.10)",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chartTitle: {
    margin: 0,
    marginBottom: 4,
    color: "#f8fafc",
    fontSize: 18,
  },
  chartSubtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 13,
  },
  metricPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(30,41,59,0.88)",
    color: "#e2e8f0",
    border: "1px solid rgba(148,163,184,0.10)",
    fontSize: 13,
  },
  contentCard: {
    background: "rgba(15,23,42,0.62)",
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(148,163,184,0.10)",
    marginBottom: 16,
  },
  contentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  contentTitle: {
    margin: 0,
    fontSize: 18,
    color: "#f8fafc",
  },
  richText: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  text: {
    lineHeight: 1.8,
    margin: 0,
    whiteSpace: "pre-line",
    color: "#f1f5f9",
    fontSize: 15,
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.10)",
    marginBottom: 18,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "rgba(15,23,42,0.92)",
  },
  th: {
    textAlign: "left",
    padding: 14,
    background: "#1e293b",
    color: "#93c5fd",
    fontSize: 14,
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: 14,
    borderBottom: "1px solid #1f2937",
    color: "#f8fafc",
  },
  tdStrong: {
    padding: 14,
    borderBottom: "1px solid #1f2937",
    color: "#f8fafc",
    fontWeight: 700,
  },
  tdMuted: {
    padding: 14,
    borderBottom: "1px solid #1f2937",
    color: "#cbd5e1",
  },
  negativeText: {
    color: "#f87171",
    fontWeight: 700,
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    marginTop: 4,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(45,212,191,0.22)",
    color: "white",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
    fontSize: 15,
  },
  chatResponseCard: {
    marginTop: 18,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: 18,
    padding: 18,
  },
  chatTitle: {
    margin: 0,
    fontSize: 18,
    color: "#f8fafc",
  },
  success: {
    color: "#34d399",
    marginTop: 12,
  },
  error: {
    color: "#fca5a5",
    marginBottom: 20,
    background: "rgba(127,29,29,0.16)",
    border: "1px solid rgba(248,113,113,0.18)",
    padding: "12px 14px",
    borderRadius: 14,
  },
  agentBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 8,
  },
  agentLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  agentChip: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(30,41,59,0.85)",
    border: "1px solid rgba(148,163,184,0.10)",
    color: "#e2e8f0",
    fontSize: 13,
  },
};