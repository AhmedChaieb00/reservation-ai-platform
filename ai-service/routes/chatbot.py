"""
AI Conversational Assistant using Groq (LLaMA 3)
"""
import os
import re
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from services.database import execute_query

logger = logging.getLogger(__name__)
chatbot_bp = Blueprint('chatbot', __name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

SYSTEM_PROMPT = """Tu es un assistant intelligent de réservation de salles de conférence pour ITEAM University, en Tunisie.
Tu aides les utilisateurs à réserver des salles, vérifier les disponibilités, et gérer leurs réservations.

Informations sur le système :
- Rôles : USER (réserve des salles), MANAGER (confirme les réservations), ADMIN (gestion complète)
- Les réservations doivent être confirmées par un manager avant d'être actives
- Équipements disponibles : projecteurs, microphones, tableaux blancs, systèmes de visioconférence, écrans interactifs
- Navigation : Tableau de bord, Salles, Réservations, Équipements, Rapports (managers/admins)

Instructions :
- Réponds TOUJOURS en français
- Sois concis, professionnel et utile
- Si on te demande des informations sur une salle spécifique, utilise le contexte fourni
- Pour créer une réservation, guide l'utilisateur vers la section "Réservations"
- Ne génère pas de données fictives si tu n'as pas l'information
- Réponds en 2-4 phrases maximum sauf si on te demande une explication détaillée"""


def get_rooms_context():
    """Fetch rooms summary for chatbot context."""
    try:
        rooms = execute_query(
            "SELECT name, capacity, location, floor FROM rooms WHERE is_active=1 ORDER BY capacity LIMIT 8"
        )
        if not rooms:
            return ""
        lines = ["Salles disponibles :"]
        for r in rooms:
            lines.append(f"- {r['name']} : {r['capacity']} personnes, {r['location']}, étage {r['floor']}")
        return "\n".join(lines)
    except Exception:
        return ""


def get_groq_response(messages: list) -> str:
    """Call Groq API directly via HTTP (OpenAI-compatible)."""
    import requests as req
    try:
        resp = req.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": messages,
                "max_tokens": 400,
                "temperature": 0.6,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return None


def get_fallback_response(message: str) -> dict:
    """Simple rule-based fallback if Groq is unavailable."""
    m = message.lower()
    if any(w in m for w in ['bonjour', 'salut', 'bonsoir', 'hello']):
        return {
            'response': "Bonjour ! Je suis votre assistant de réservation ITEAM. Comment puis-je vous aider ?",
            'suggestions': ['Trouver une salle', 'Mes réservations', 'Aide']
        }
    if any(w in m for w in ['salle', 'réserver', 'disponible']):
        return {
            'response': "Pour réserver une salle, rendez-vous dans la section Réservations. Vous pouvez y voir le calendrier et créer une nouvelle réservation.",
            'suggestions': ['Voir les salles', 'Créer une réservation']
        }
    if any(w in m for w in ['annuler', 'cancel']):
        return {
            'response': "Pour annuler une réservation, allez dans Réservations, trouvez la réservation concernée et cliquez sur Annuler.",
            'suggestions': ['Mes réservations']
        }
    return {
        'response': "Je suis votre assistant de réservation ITEAM. Je peux vous aider à trouver une salle, consulter vos réservations ou vous guider dans le système.",
        'suggestions': ['Trouver une salle', 'Mes réservations', 'Aide']
    }


# In-memory session store (simple, per process)
_sessions: dict = {}


@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    """
    POST /api/chat
    Body: { message, userId, sessionId }
    """
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    user_id = data.get('userId')
    session_id = data.get('sessionId', f"user_{user_id}")

    if not message:
        return jsonify({'error': 'Message required'}), 400

    if not GROQ_API_KEY:
        fallback = get_fallback_response(message)
        return jsonify({
            'response': fallback['response'],
            'suggestions': fallback.get('suggestions', []),
            'intent': 'unknown',
            'timestamp': datetime.now().isoformat()
        })

    # Build conversation history
    history = _sessions.get(session_id, [])

    # Build system message with context
    rooms_ctx = get_rooms_context()
    system_content = SYSTEM_PROMPT
    if rooms_ctx:
        system_content += f"\n\nContexte actuel :\n{rooms_ctx}"

    messages = [{"role": "system", "content": system_content}]
    # Include last 8 messages for context
    messages.extend(history[-8:])
    messages.append({"role": "user", "content": message})

    response_text = get_groq_response(messages)

    if response_text is None:
        fallback = get_fallback_response(message)
        response_text = fallback['response']
        suggestions = fallback.get('suggestions', [])
    else:
        suggestions = _infer_suggestions(message, response_text)

    # Update session history
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": response_text})
    _sessions[session_id] = history[-20:]  # keep last 20 messages

    return jsonify({
        'response': response_text,
        'suggestions': suggestions,
        'intent': 'groq',
        'timestamp': datetime.now().isoformat()
    })


def _infer_suggestions(user_msg: str, bot_response: str) -> list:
    """Generate contextual follow-up suggestions."""
    combined = (user_msg + ' ' + bot_response).lower()
    if any(w in combined for w in ['salle', 'réserver', 'disponible', 'réservation']):
        return ['Voir les salles disponibles', 'Créer une réservation']
    if any(w in combined for w in ['annuler', 'modifier', 'changer']):
        return ['Mes réservations', 'Contacter un responsable']
    if any(w in combined for w in ['équipement', 'projecteur', 'micro']):
        return ['Salles avec projecteur', 'Voir les équipements']
    if any(w in combined for w in ['rapport', 'statistique', 'occupation']):
        return ['Aller aux rapports']
    return ['Trouver une salle', 'Mes réservations']
