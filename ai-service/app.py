"""
AI Service - Système de Gestion de Réservation
Backend IA: Recommandation, Prédiction, Anomalies, Chatbot, Sentiment
"""
import os
import logging
import secrets
from flask import Flask
from flask_cors import CORS

from routes.recommendation import recommendation_bp
from routes.prediction import prediction_bp
from routes.anomaly import anomaly_bp
from routes.chatbot import chatbot_bp
from routes.sentiment import sentiment_bp

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    # No hardcoded fallback: use an ephemeral random key when SECRET_KEY is not provided
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    app.config['DATABASE_URL'] = os.environ.get('DATABASE_URL', '')

    origins = [o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins}})

    app.register_blueprint(recommendation_bp, url_prefix='/api')
    app.register_blueprint(prediction_bp, url_prefix='/api')
    app.register_blueprint(anomaly_bp, url_prefix='/api')
    app.register_blueprint(chatbot_bp, url_prefix='/api')
    app.register_blueprint(sentiment_bp, url_prefix='/api')

    @app.route('/api/health')
    def health():
        return {'status': 'UP', 'service': 'AI-Backend', 'version': '1.0.0'}

    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Not found', 'message': str(e)}, 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal error: {e}")
        return {'error': 'Internal server error'}, 500

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    logger.info(f"Starting AI service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
