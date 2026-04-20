import os
from openai import OpenAI


def responder_estrategia_chatgpt(pregunta: str, contexto=None) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI no está configurado. Falta OPENAI_API_KEY."

    model = os.getenv("OPENAI_MODEL", "gpt-4.1")
    client = OpenAI(api_key=api_key)

    prompt = f"""
Actúa como consultor estratégico senior.

Contexto:
{contexto}

Pregunta:
{pregunta}

Responde:
- en español
- con lenguaje claro y amigable
- con foco de negocio
- con recomendaciones accionables
"""

    try:
        response = client.responses.create(
            model=model,
            input=prompt,
        )
        return response.output_text or "No se ha generado respuesta."
    except Exception as e:
        return f"Error OpenAI: {str(e)}"