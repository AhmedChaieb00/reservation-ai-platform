"""
Demand Prediction Module
Forecasts room occupancy and peak hours using historical reservation data.
"""
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify
from services.database import execute_query

logger = logging.getLogger(__name__)
prediction_bp = Blueprint('prediction', __name__)


@prediction_bp.route('/predict', methods=['GET'])
def predict_demand():
    """
    GET /api/predict?roomId=&weeks=4
    Predict occupancy for the next N weeks based on historical patterns.
    """
    room_id = request.args.get('roomId')
    weeks = int(request.args.get('weeks', 4))

    # Fetch historical data (last 90 days)
    history_query = """
        SELECT r.room_id, r.start_time, r.end_time,
               DAYOFWEEK(r.start_time) as day_of_week,
               HOUR(r.start_time) as hour_of_day,
               ro.capacity
        FROM reservations r
        JOIN rooms ro ON r.room_id = ro.id
        WHERE r.status IN ('CONFIRMED', 'COMPLETED')
        AND r.start_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    """
    params = {}
    if room_id:
        history_query += " AND r.room_id = :room_id"
        params['room_id'] = room_id

    history = execute_query(history_query, params)

    # Compute patterns by day of week and hour
    day_patterns = defaultdict(int)
    hour_patterns = defaultdict(int)
    weekly_counts = defaultdict(int)

    for record in history:
        dow = record.get('day_of_week', 1)
        hour = record.get('hour_of_day', 9)
        day_patterns[dow] += 1
        hour_patterns[hour] += 1
        week_num = int(record['start_time'].strftime('%U')) if hasattr(record.get('start_time', ''), 'strftime') else 0
        weekly_counts[week_num] += 1

    # Generate weekly predictions
    predictions = []
    total_history = len(history)
    weeks_of_data = max(13, 1)  # ~90 days = ~13 weeks

    base_weekly = total_history / weeks_of_data if weeks_of_data > 0 else 5

    today = datetime.now()
    for week_offset in range(1, weeks + 1):
        week_start = today + timedelta(weeks=week_offset)
        # Apply slight trend variation (sinusoidal for academic calendar effect)
        import math
        month = week_start.month
        # Peak months: Jan(exams), Mar(mid-term), May(finals), Oct(rentrée)
        peak_months = {1: 1.3, 3: 1.2, 5: 1.4, 10: 1.5, 11: 1.2}
        trend = peak_months.get(month, 1.0)
        predicted = int(base_weekly * trend)
        predictions.append({
            'week': week_start.strftime('%Y-W%U'),
            'weekStart': week_start.strftime('%Y-%m-%d'),
            'predictedReservations': predicted,
            'occupancyRate': min(95, int(predicted * 8)),  # rough occupancy estimate
            'trend': 'HIGH' if trend > 1.2 else 'NORMAL' if trend == 1.0 else 'LOW'
        })

    # Peak hours analysis
    peak_hours = sorted(
        [{'hour': h, 'reservationCount': c} for h, c in hour_patterns.items()],
        key=lambda x: x['reservationCount'],
        reverse=True
    )[:5]

    # Peak days
    day_names = {1: 'Dimanche', 2: 'Lundi', 3: 'Mardi', 4: 'Mercredi',
                 5: 'Jeudi', 6: 'Vendredi', 7: 'Samedi'}
    peak_days = sorted(
        [{'day': day_names.get(d, str(d)), 'dayNum': d, 'reservationCount': c}
         for d, c in day_patterns.items()],
        key=lambda x: x['reservationCount'],
        reverse=True
    )[:3]

    return jsonify({
        'weeklyPredictions': predictions,
        'peakHours': peak_hours,
        'peakDays': peak_days,
        'dataPoints': total_history,
        'analysisperiod': '90 derniers jours'
    })


@prediction_bp.route('/predict/rooms', methods=['GET'])
def predict_room_demand():
    """GET /api/predict/rooms - Occupancy prediction per room."""
    query = """
        SELECT ro.id, ro.name, ro.capacity,
               COUNT(r.id) as total_reservations,
               AVG(TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time)) as avg_duration_minutes
        FROM rooms ro
        LEFT JOIN reservations r ON ro.id = r.room_id
            AND r.status IN ('CONFIRMED','COMPLETED')
            AND r.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE ro.is_active = TRUE
        GROUP BY ro.id, ro.name, ro.capacity
        ORDER BY total_reservations DESC
    """
    rooms_stats = execute_query(query)

    result = []
    for room in rooms_stats:
        total = room.get('total_reservations', 0) or 0
        avg_dur = room.get('avg_duration_minutes', 60) or 60
        # Working hours: 8h-20h = 720 min/day * 22 working days/month
        available_minutes = 720 * 22
        used_minutes = total * avg_dur
        occupancy = min(100, int((used_minutes / available_minutes) * 100)) if available_minutes > 0 else 0
        result.append({
            'roomId': room['id'],
            'roomName': room['name'],
            'capacity': room['capacity'],
            'reservationsLast30Days': total,
            'occupancyRate': occupancy,
            'avgDurationMinutes': int(avg_dur),
            'prediction': 'FORTE DEMANDE' if occupancy > 70 else 'DEMANDE NORMALE' if occupancy > 30 else 'FAIBLE UTILISATION'
        })

    return jsonify({'roomPredictions': result})
