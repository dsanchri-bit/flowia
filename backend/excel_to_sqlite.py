from pathlib import Path
import sqlite3
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
EXCEL_PATH = BASE_DIR / "web y multimedia.xlsx"
DB_PATH = BASE_DIR / "flowia.db"


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
    return df


def to_num(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    for col in cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def process_empleados(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = to_num(df, [
        "jornada_pct",
        "salario_base_anual_eur",
        "bonus_pct",
        "coste_ss_pct",
        "coste_total_anual_eur",
    ])

    if all(c in df.columns for c in ["salario_base_anual_eur", "jornada_pct", "bonus_pct", "coste_ss_pct"]):
        df["coste_total_anual_eur"] = (
            df["salario_base_anual_eur"] * df["jornada_pct"]
        ) * (1 + df["bonus_pct"] + df["coste_ss_pct"])

    return df


def process_gastos(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = to_num(df, [
        "importe_sin_iva_eur",
        "iva_pct",
        "importe_total_eur",
    ])

    if all(c in df.columns for c in ["importe_sin_iva_eur", "iva_pct"]):
        df["importe_total_eur"] = df["importe_sin_iva_eur"] * (1 + df["iva_pct"])

    return df


def process_ingresos(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = to_num(df, [
        "unidades",
        "precio_unitario_eur",
        "ingreso_bruto_eur",
        "descuento_pct",
        "ingreso_neto_eur",
        "coste_directo_eur",
        "margen_bruto_eur",
    ])

    if all(c in df.columns for c in ["unidades", "precio_unitario_eur"]):
        df["ingreso_bruto_eur"] = df["unidades"] * df["precio_unitario_eur"]

    if all(c in df.columns for c in ["ingreso_bruto_eur", "descuento_pct"]):
        df["ingreso_neto_eur"] = df["ingreso_bruto_eur"] * (1 - df["descuento_pct"])

    if all(c in df.columns for c in ["ingreso_neto_eur", "coste_directo_eur"]):
        df["margen_bruto_eur"] = df["ingreso_neto_eur"] - df["coste_directo_eur"]

    return df


def main():
    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"No se encontró el Excel en: {EXCEL_PATH}")

    xls = pd.ExcelFile(EXCEL_PATH)
    conn = sqlite3.connect(DB_PATH)

    hojas_detectadas = []

    for sheet in xls.sheet_names:
        raw = pd.read_excel(EXCEL_PATH, sheet_name=sheet)

        sheet_norm = str(sheet).strip().lower()

        if sheet_norm == "empleados":
            df = process_empleados(raw)
            table_name = "empleados"
        elif sheet_norm == "gastos":
            df = process_gastos(raw)
            table_name = "gastos"
        elif sheet_norm == "ingresos":
            df = process_ingresos(raw)
            table_name = "ingresos"
        else:
            df = normalize_columns(raw)
            table_name = sheet_norm.replace(" ", "_")

        df.to_sql(table_name, conn, if_exists="replace", index=False)
        hojas_detectadas.append(table_name)
        print(f"Tabla creada: {table_name} ({len(df)} registros)")

    meta = pd.DataFrame([{
        "archivo": EXCEL_PATH.name,
        "hojas": ",".join(hojas_detectadas)
    }])
    meta.to_sql("proyecto_meta", conn, if_exists="replace", index=False)

    conn.close()
    print("Base de datos lista")


if __name__ == "__main__":
    main()