from pathlib import Path
from typing import Optional, Dict, Any
import sqlite3
import shutil
import subprocess

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from gemini_agent import generar_texto_profesional, generar_analisis_financiero_gemini
from openai_agent import responder_estrategia_chatgpt
from pdf_generator import generar_pdf

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "flowia.db"

app = FastAPI(title="FlowIA Intelligence API", version="5.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StrategyChatRequest(BaseModel):
    pregunta: str
    contexto: Optional[dict] = None


def conectar_db() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail=f"No se encontró la base de datos en: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def tabla_existe(conn: sqlite3.Connection, nombre_tabla: str) -> bool:
    cur = conn.cursor()
    cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (nombre_tabla,)
    )
    return cur.fetchone() is not None


def leer_meta_proyecto() -> Dict[str, Any]:
    conn = conectar_db()
    if not tabla_existe(conn, "proyecto_meta"):
        conn.close()
        return {"archivo": None, "hojas": None}

    cur = conn.cursor()
    cur.execute("SELECT * FROM proyecto_meta LIMIT 1")
    row = cur.fetchone()
    conn.close()

    return dict(row) if row else {"archivo": None, "hojas": None}


def contar_registros(conn: sqlite3.Connection, tabla: str) -> int:
    try:
        cur = conn.cursor()
        cur.execute(f'SELECT COUNT(*) AS total FROM "{tabla}"')
        row = cur.fetchone()
        return int(row["total"] or 0)
    except Exception:
        return 0


def sumar_columna(conn: sqlite3.Connection, tabla: str, columna: str) -> float:
    try:
        cur = conn.cursor()
        cur.execute(f'SELECT SUM(CAST("{columna}" AS REAL)) AS total FROM "{tabla}"')
        row = cur.fetchone()
        return round(float(row["total"] or 0), 2)
    except Exception:
        return 0.0


def preview_tabla(conn: sqlite3.Connection, tabla: str, limit: int = 5):
    try:
        cur = conn.cursor()
        cur.execute(f'SELECT * FROM "{tabla}" LIMIT {limit}')
        return [dict(r) for r in cur.fetchall()]
    except Exception:
        return []


def obtener_datos_empresa() -> Dict[str, Any]:
    conn = conectar_db()

    data = {
        "meta": leer_meta_proyecto(),
        "empleados": None,
        "gastos": None,
        "ingresos": None,
    }

    for tabla in ["empleados", "gastos", "ingresos"]:
        if tabla_existe(conn, tabla):
            data[tabla] = {
                "total": contar_registros(conn, tabla),
                "preview": preview_tabla(conn, tabla, 5),
            }

    conn.close()
    return data


def obtener_kpis_empresa() -> Dict[str, Any]:
    conn = conectar_db()

    total_empleados = contar_registros(conn, "empleados") if tabla_existe(conn, "empleados") else 0
    registros_gastos = contar_registros(conn, "gastos") if tabla_existe(conn, "gastos") else 0
    registros_ingresos = contar_registros(conn, "ingresos") if tabla_existe(conn, "ingresos") else 0

    total_ingresos = sumar_columna(conn, "ingresos", "ingreso_neto_eur") if tabla_existe(conn, "ingresos") else 0.0
    total_gastos = sumar_columna(conn, "gastos", "importe_total_eur") if tabla_existe(conn, "gastos") else 0.0
    coste_laboral = sumar_columna(conn, "empleados", "coste_total_anual_eur") if tabla_existe(conn, "empleados") else 0.0
    margen_bruto_total = sumar_columna(conn, "ingresos", "margen_bruto_eur") if tabla_existe(conn, "ingresos") else 0.0

    coste_total_empresa = round(total_gastos + coste_laboral, 2)
    beneficio_estimado = round(total_ingresos - coste_total_empresa, 2)
    margen_estimado_pct = round((beneficio_estimado / total_ingresos) * 100, 2) if total_ingresos else 0.0

    conn.close()

    return {
        "total_empleados": total_empleados,
        "registros_gastos": registros_gastos,
        "registros_ingresos": registros_ingresos,
        "total_ingresos": total_ingresos,
        "total_gastos_operativos": total_gastos,
        "coste_laboral_estimado": coste_laboral,
        "coste_total_empresa": coste_total_empresa,
        "margen_bruto_total": margen_bruto_total,
        "beneficio_estimado": beneficio_estimado,
        "margen_estimado_pct": margen_estimado_pct,
    }


def agente_analisis_general() -> Dict[str, Any]:
    datos = obtener_datos_empresa()
    kpis = obtener_kpis_empresa()

    resumen_texto = (
        f"La empresa cuenta con {kpis['total_empleados']} empleados. "
        f"Se han cargado {kpis['registros_gastos']} registros de gastos y "
        f"{kpis['registros_ingresos']} registros de ingresos. "
        f"El volumen estimado de ingresos asciende a {kpis['total_ingresos']:.2f} €, "
        f"los gastos operativos a {kpis['total_gastos_operativos']:.2f} € y "
        f"el coste laboral estimado a {kpis['coste_laboral_estimado']:.2f} €. "
        f"El beneficio estimado se sitúa en {kpis['beneficio_estimado']:.2f} €."
    )

    insights = [
        "FlowIA ha identificado correctamente las tres capas principales del negocio: personas, gastos e ingresos.",
        "Ya es posible construir una lectura conjunta de operación, costes y rentabilidad.",
        "La empresa combina servicios recurrentes y proyectos con potencial de margen."
    ]

    texto_ia = generar_texto_profesional({
        "resumen_ejecutivo": resumen_texto,
        "insights": insights,
        "riesgos": [
            "La rentabilidad depende de mantener controlados el coste laboral y los gastos operativos."
        ],
        "recomendaciones": [
            "Priorizar líneas de servicio con mejor margen bruto.",
            "Revisar clientes o proyectos que consumen mucha estructura para poco retorno."
        ]
    })

    return {
        "titulo": "Análisis general",
        "resumen_ejecutivo": resumen_texto,
        "texto_ia": texto_ia,
        "insights": insights,
        "kpis": kpis,
        "datos": datos,
    }


def agente_analisis_financiero() -> Dict[str, Any]:
    kpis = obtener_kpis_empresa()

    tabla = [
        {
            "tipo": "Ingresos",
            "columna": "ingreso_neto_eur",
            "total": round(kpis["total_ingresos"], 2),
            "media": round(kpis["total_ingresos"] / kpis["registros_ingresos"], 2) if kpis["registros_ingresos"] else 0.0,
        },
        {
            "tipo": "Gastos",
            "columna": "importe_total_eur",
            "total": round(kpis["total_gastos_operativos"], 2),
            "media": round(kpis["total_gastos_operativos"] / kpis["registros_gastos"], 2) if kpis["registros_gastos"] else 0.0,
        },
        {
            "tipo": "Coste laboral",
            "columna": "coste_total_anual_eur",
            "total": round(kpis["coste_laboral_estimado"], 2),
            "media": round(kpis["coste_laboral_estimado"] / kpis["total_empleados"], 2) if kpis["total_empleados"] else 0.0,
        },
        {
            "tipo": "Margen bruto",
            "columna": "margen_bruto_eur",
            "total": round(kpis["margen_bruto_total"], 2),
            "media": round(kpis["margen_bruto_total"] / kpis["registros_ingresos"], 2) if kpis["registros_ingresos"] else 0.0,
        },
        {
            "tipo": "Beneficio",
            "columna": "beneficio_estimado",
            "total": round(kpis["beneficio_estimado"], 2),
            "media": 0.0,
        },
        {
            "tipo": "Margen %",
            "columna": "margen_estimado_pct",
            "total": round(kpis["margen_estimado_pct"], 2),
            "media": 0.0,
        },
    ]

    texto_ia = generar_analisis_financiero_gemini(tabla)

    return {
        "titulo": "Análisis financiero",
        "tabla": tabla,
        "texto_ia": texto_ia,
        "kpis": kpis,
    }


def agente_estrategia() -> Dict[str, Any]:
    datos = obtener_datos_empresa()
    kpis = obtener_kpis_empresa()

    contexto = {
        "meta": datos["meta"],
        "kpis": kpis,
        "datos": datos,
    }

    estrategia = responder_estrategia_chatgpt(
        pregunta=(
            "Analiza este negocio y propone una estrategia clara, concisa y accionable. "
            "Usa un lenguaje profesional pero fácil de entender. "
            "Incluye prioridades, quick wins, riesgos y próximos pasos."
        ),
        contexto=contexto
    )

    return {
        "titulo": "Estrategia",
        "estrategia_base": estrategia,
        "contexto": contexto,
    }


@app.get("/")
def root():
    return {"message": "FlowIA Intelligence API funcionando"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload_excel")
def upload_excel(file: UploadFile = File(...)):
    try:
        filename = file.filename.lower()
        excel_path = BASE_DIR / "web y multimedia.xlsx"
        csv_path = BASE_DIR / "web y multimedia.csv"

        if filename.endswith(".csv"):
            file_path = csv_path
            if excel_path.exists():
                excel_path.unlink()
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            file_path = excel_path
            if csv_path.exists():
                csv_path.unlink()
        else:
            raise HTTPException(
                status_code=400,
                detail="Formato no soportado. Usa archivos Excel o CSV."
            )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resultado = subprocess.run(
            ["python", "excel_to_sqlite.py"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )

        if resultado.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Error procesando archivo: {resultado.stderr}"
            )

        return {
            "status": "ok",
            "message": "Archivo cargado y procesado correctamente",
            "detalle": resultado.stdout
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/analisis")
def analisis():
    return agente_analisis_general()


@app.get("/analisis_financiero")
def analisis_financiero():
    return agente_analisis_financiero()


@app.get("/estrategia")
def estrategia():
    return agente_estrategia()


@app.post("/estrategia/chat")
def estrategia_chat(req: StrategyChatRequest):
    respuesta = responder_estrategia_chatgpt(
        pregunta=req.pregunta,
        contexto=req.contexto,
    )
    return {"respuesta": respuesta}


@app.get("/exportar_pdf")
def exportar_pdf():
    analisis = agente_analisis_general()
    financiero = agente_analisis_financiero()
    estrategia = agente_estrategia()

    pdf_path = generar_pdf(
        analisis=analisis,
        financiero=financiero,
        estrategia=estrategia
    )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename="informe_flowia.pdf"
    )