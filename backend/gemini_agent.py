import os
from google import genai
from openai import OpenAI


def generar_texto_profesional(datos) -> str:
    # -------------------------
    # INTENTO GEMINI
    # -------------------------
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"""
Actúa como consultor senior de negocio.

Explica esto:
- lenguaje claro
- tono profesional
- fácil de entender
- directo

Datos:
{datos}
"""
            )

            if response.text:
                return f"🤖 Gemini:\n\n{response.text}"

    except Exception as e:
        print("⚠️ Gemini fallo:", e)

    # -------------------------
    # FALLBACK OPENAI
    # -------------------------
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            client = OpenAI(api_key=api_key)

            response = client.responses.create(
                model="gpt-4.1-mini",
                input=f"""
Explica este análisis de negocio de forma clara y profesional:

{datos}
"""
            )

            return f"🤖 OpenAI:\n\n{response.output_text}"

    except Exception as e:
        print("⚠️ OpenAI fallo:", e)

    # -------------------------
    # FALLBACK FINAL
    # -------------------------
    return "FlowIA ha generado el análisis, pero los modelos de IA están saturados en este momento."
def generar_analisis_financiero_gemini(tabla) -> str:
    # -------------------------
    # GEMINI
    # -------------------------
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"""
Actúa como CFO.

Analiza esta tabla:
- qué está pasando
- riesgos
- oportunidades
- conclusión clara

Tabla:
{tabla}
"""
            )

            if response.text:
                return f"📊 Gemini:\n\n{response.text}"

    except Exception as e:
        print("⚠️ Gemini fallo financiero:", e)

    # -------------------------
    # FALLBACK OPENAI
    # -------------------------
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            client = OpenAI(api_key=api_key)

            response = client.responses.create(
                model="gpt-4.1-mini",
                input=f"""
Analiza esta tabla financiera de forma clara:

{tabla}
"""
            )

            return f"📊 OpenAI:\n\n{response.output_text}"

    except Exception as e:
        print("⚠️ OpenAI fallo financiero:", e)

    return "No se ha podido generar el análisis financiero en este momento."