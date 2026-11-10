"""
Anomaly Detection Module
Detects unusual patterns: no-shows, monopolization, abnormal durations.
"""
import logging
from flask import Blueprint, jsonify
from services.database import execute_query

logger = logging.getLogger(__name__)
anomaly_bp = Blueprint('anomaly', __name__)


@anomaly_bp.route('/anomalies', methods=['GET'])
def detect_anomalies():
    """GET /api/anomalies - Returns detected anomalies."""
    anomalies = []

    # 1. Detect recurrent no-shows (users who book but often cancel last minute)
    noshow_query = """
        SELECT u.id as user_id, CONCAT(u.first_name, ' ', u.last_name) as user_name,
               u.email,
               COUNT(CASE WHEN r.status = 'CANCELLED' THEN 1 END) as cancellations,
               COUNT(*) as total_reservations,
               ROUND(COUNT(CASE WHEN r.status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(*), 1) as cancel_rate
        FROM users u
        JOIN reservations r ON u.id = r.user_id
        WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY u.id, u.first_name, u.last_name, u.email
        HAVING total_reservations >= 3 AND cancel_rate > 50
        ORDER BY cancel_rate DESC
        LIMIT 10
    """
    noshows = execute_query(noshow_query)
    for ns in noshows:
        anomalies.append({
            'type': 'NO_SHOW',
            'severity': 'HIGH' if ns['cancel_rate'] > 75 else 'MEDIUM',
            'userId': ns['user_id'],
            'userName': ns['user_name'],
            'description': f"Taux d'annulation élevé : {ns['cancel_rate']}% ({ns['cancellations']}/{ns['total_reservations']} réservations)",
            'recommendation': 'Contacter l\'utilisateur pour comprendre les raisons des annulations fréquentes'
        })

    # 2. Detect room monopolization (single user dominating a room)
    monopoly_query = """
        SELECT r.user_id, CONCAT(u.first_name, ' ', u.last_name) as user_name,
               r.room_id, ro.name as room_name,
               COUNT(*) as booking_count,
               SUM(TIMESTAMPDIFF(HOUR, r.start_time, r.end_time)) as total_hours
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN rooms ro ON r.room_id = ro.id
        WHERE r.status IN ('CONFIRMED','COMPLETED')
        AND r.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY r.user_id, u.first_name, u.last_name, r.room_id, ro.name
        HAVING booking_count >= 5
        ORDER BY booking_count DESC
        LIMIT 10
    """
    monopolies = execute_query(monopoly_query)
    for mono in monopolies:
        anomalies.append({
            'type': 'MONOPOLIZATION',
            'severity': 'MEDIUM',
            'userId': mono['user_id'],
            'userName': mono['user_name'],
            'roomName': mono['room_name'],
            'description': f"{mono['user_name']} a réservé {mono['room_name']} {mono['booking_count']} fois ce mois ({mono['total_hours']}h total)",
            'recommendation': 'Vérifier si cette utilisation intensive est justifiée'
        })

    # 3. Detect abnormally long reservations
    long_query = """
        SELECT r.id, r.title, CONCAT(u.first_name,' ',u.last_name) as user_name,
               ro.name as room_name,
               TIMESTAMPDIFF(HOUR, r.start_time, r.end_time) as duration_hours,
               r.start_time
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN rooms ro ON r.room_id = ro.id
        WHERE r.status IN ('PENDING','CONFIRMED')
        AND TIMESTAMPDIFF(HOUR, r.start_time, r.end_time) > 8
        ORDER BY duration_hours DESC
        LIMIT 5
    """
    long_reservations = execute_query(long_query)
    for lr in long_reservations:
        anomalies.append({
            'type': 'ABNORMAL_DURATION',
            'severity': 'LOW',
            'userName': lr['user_name'],
            'roomName': lr['room_name'],
            'description': f"Réservation de {lr['duration_hours']}h pour '{lr['title']}' - durée inhabituelle",
            'recommendation': 'Confirmer que cette durée est nécessaire avec l\'organisateur'
        })

    # 4. Detect participant/capacity mismatch
    mismatch_query = """
        SELECT r.id, r.title, r.participants_count, ro.capacity,
               CONCAT(u.first_name,' ',u.last_name) as user_name, ro.name as room_name,
               ROUND(r.participants_count * 100.0 / ro.capacity, 0) as utilization_pct
        FROM reservations r
        JOIN rooms ro ON r.room_id = ro.id
        JOIN users u ON r.user_id = u.id
        WHERE r.status IN ('PENDING','CONFIRMED')
        AND (r.participants_count < ro.capacity * 0.15 OR r.participants_count > ro.capacity)
        ORDER BY utilization_pct
        LIMIT 5
    """
    mismatches = execute_query(mismatch_query)
    for mm in mismatches:
        if mm['participants_count'] > mm['capacity']:
            msg = f"Surréservation: {mm['participants_count']} participants pour une salle de {mm['capacity']} places"
            rec = "Réaffecter vers une salle de plus grande capacité"
            sev = 'HIGH'
        else:
            msg = f"Sous-utilisation: {mm['participants_count']} participants dans une salle de {mm['capacity']} places ({mm['utilization_pct']}%)"
            rec = "Proposer une salle plus petite pour libérer cet espace"
            sev = 'LOW'
        anomalies.append({
            'type': 'CAPACITY_MISMATCH',
            'severity': sev,
            'userName': mm['user_name'],
            'roomName': mm['room_name'],
            'description': msg,
            'recommendation': rec
        })

    return jsonify({
        'anomalies': anomalies,
        'total': len(anomalies),
        'summary': {
            'HIGH': sum(1 for a in anomalies if a['severity'] == 'HIGH'),
            'MEDIUM': sum(1 for a in anomalies if a['severity'] == 'MEDIUM'),
            'LOW': sum(1 for a in anomalies if a['severity'] == 'LOW')
        }
    })
