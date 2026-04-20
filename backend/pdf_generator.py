from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

BASE_DIR = Path(__file__).resolve().parent


def safe_text(value):
    if value is None:
        return ""
    text = str(value)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generar_pdf(analisis, financiero, estrategia):
    file_path = BASE_DIR / "informe_flowia.pdf"

    doc = SimpleDocTemplate(
        str(file_path),
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("FLOWIA · INFORME EJECUTIVO", styles["Title"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("1. Análisis general", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(safe_text(analisis.get("resumen_ejecutivo", "")), styles["BodyText"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(safe_text(analisis.get("texto_ia", "")), styles["BodyText"]))
    story.append(Spacer(1, 18))

    story.append(Paragraph("2. Análisis financiero", styles["Heading2"]))
    story.append(Spacer(1, 8))

    tabla_fin = financiero.get("tabla", [])
    if tabla_fin:
        data = [["Tipo", "Concepto", "Total", "Media"]]
        for row in tabla_fin:
            data.append([
                safe_text(row.get("tipo", "")),
                safe_text(row.get("columna", "")),
                safe_text(row.get("total", "")),
                safe_text(row.get("media", "")),
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 10))

    story.append(Paragraph(safe_text(financiero.get("texto_ia", "")), styles["BodyText"]))
    story.append(Spacer(1, 18))

    story.append(Paragraph("3. Estrategia", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(safe_text(estrategia.get("estrategia_base", "")), styles["BodyText"]))

    doc.build(story)
    return str(file_path)