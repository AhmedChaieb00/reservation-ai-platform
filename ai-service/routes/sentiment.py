"""
Sentiment Analysis Module
Analyzes user feedback and classifies sentiment.
"""
import re
import logging
from flask import Blueprint, request, jsonify
from services.database import execute_query

logger = logging.getLogger(__name__)
sentiment_bp = Blueprint('sentiment', __name__)

# Simple rule-based sentiment for French text
POSITIVE_WORDS = {
    'excellent', 'parfait', 'super', 'bien', 'bon', 'bonne', 'génial', 'top',
    'satisfait', 'satisfaite', 'agréable', 'propre', 'moderne', 'efficace',
    'fonctionnel', 'pratique', 'confortable', 'recommendé', 'apprécié', 'content',
    'très bien', 'très bon', 'formidable', 'impeccable', 'nickel'
}

NEGATIVE_WORDS = {
    'mauvais', 'mauvaise', 'défaillant', 'cassé', 'sale', 'bruyant', 'froid',
    'chaud', 'problème', 'panne', 'dysfonctionnement', 'décevant', 'décevante',
    'insuffisant', 'inadéquat', 'difficile', 'compliqué', 'lent', 'défectueux',
    'insatisfait', 'insatisfaite', 'terrible', 'nul', 'nulle', 'horrible'
}

NEGATION_WORDS = {'pas', 'non', 'jamais', 'ne', 'ni', 'aucun', 'aucune'}


def analyze_sentiment(text):
    """Simple rule-based French sentiment analysis."""
    if not text:
        return 'NEUTRAL', 0.5

    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)

    positive_score = 0
    negative_score = 0

    for i, word in enumerate(words):
        # Check for negation in previous 2 words
        negated = any(words[max(0, i-2):i].count(neg) > 0 for neg in NEGATION_WORDS)

        if word in POSITIVE_WORDS:
            if negated:
                negative_score += 1
            else:
                positive_score += 1
        elif word in NEGATIVE_WORDS:
            if negated:
                positive_score += 0.5
            else:
                negative_score += 1

    # Check bigrams for phrases like "très bien"
    for i in range(len(words) - 1):
        bigram = f"{words[i]} {words[i+1]}"
        if bigram in POSITIVE_WORDS:
            positive_score += 1.5
        elif bigram in NEGATIVE_WORDS:
            negative_score += 1.5

    total = positive_score + negative_score
    if total == 0:
        return 'NEUTRAL', 0.5

    confidence = max(positive_score, negative_score) / total
    if positive_score > negative_score:
        return 'POSITIVE', round(confidence, 2)
    elif negative_score > positive_score:
        return 'NEGATIVE', round(confidence, 2)
    else:
        return 'NEUTRAL', 0.5


@sentiment_bp.route('/sentiment/analyze', methods=['POST'])
def analyze():
    """
    POST /api/sentiment/analyze
    Body: { text, reservationId (optional) }
    Returns: { sentiment, confidence, label }
    """
    data = request.get_json() or {}
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'Text required'}), 400

    sentiment, confidence = analyze_sentiment(text)

    labels = {
        'POSITIVE': 'Positif',
        'NEUTRAL': 'Neutre',
        'NEGATIVE': 'Négatif'
    }

    return jsonify({
        'sentiment': sentiment,
        'confidence': confidence,
        'label': labels[sentiment],
        'text': text[:100]
    })


@sentiment_bp.route('/sentiment/dashboard', methods=['GET'])
def sentiment_dashboard():
    """GET /api/sentiment/dashboard - Feedback sentiment statistics."""
    stats_query = """
        SELECT
            sentiment,
            COUNT(*) as count,
            AVG(rating) as avg_rating,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM feedback WHERE sentiment IS NOT NULL), 1) as percentage
        FROM feedback
        WHERE sentiment IS NOT NULL
        GROUP BY sentiment
    """
    stats = execute_query(stats_query)

    recent_query = """
        SELECT f.rating, f.comment, f.sentiment, f.created_at,
               ro.name as room_name,
               CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM feedback f
        JOIN reservations r ON f.reservation_id = r.id
        JOIN rooms ro ON r.room_id = ro.id
        JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
        LIMIT 10
    """
    recent = execute_query(recent_query)

    avg_rating_query = "SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM feedback"
    avg_data = execute_query(avg_rating_query)
    avg_rating = round(avg_data[0]['avg_rating'], 2) if avg_data and avg_data[0]['avg_rating'] else 0
    total = avg_data[0]['total'] if avg_data else 0

    # Negative feedbacks needing attention
    alerts_query = """
        SELECT f.comment, f.rating, ro.name as room_name, f.created_at,
               CONCAT(u.first_name,' ',u.last_name) as user_name
        FROM feedback f
        JOIN reservations r ON f.reservation_id = r.id
        JOIN rooms ro ON r.room_id = ro.id
        JOIN users u ON f.user_id = u.id
        WHERE f.sentiment = 'NEGATIVE' OR f.rating <= 2
        ORDER BY f.created_at DESC
        LIMIT 5
    """
    alerts = execute_query(alerts_query)

    return jsonify({
        'sentimentDistribution': stats,
        'recentFeedback': recent,
        'averageRating': avg_rating,
        'totalFeedback': total,
        'alerts': alerts,
        'alertCount': len(alerts)
    })
