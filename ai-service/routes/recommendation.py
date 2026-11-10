"""
Room Recommendation Engine
Recommends conference rooms based on: capacity, equipment, user history,
proximity (department), and usual time patterns.
"""
import logging
from flask import Blueprint, request, jsonify
from services.database import execute_query

logger = logging.getLogger(__name__)
recommendation_bp = Blueprint('recommendation', __name__)


def score_room(room, requirements, user_history):
    """Score a room (0-100) based on how well it matches requirements."""
    score = 0

    # Capacity score (40 pts): prefer rooms where capacity >= participants but not too large
    participants = requirements.get('participants', 1)
    capacity = room.get('capacity', 0)
    if capacity >= participants:
        # Perfect fit: slightly larger than needed
        ratio = capacity / max(participants, 1)
        if ratio <= 1.5:
            score += 40
        elif ratio <= 2.5:
            score += 30
        elif ratio <= 4:
            score += 20
        else:
            score += 10
    # If room is too small, score stays 0 for capacity

    # Equipment score (30 pts)
    required_equipment = requirements.get('equipmentTypes', [])
    if required_equipment:
        room_equipment = [e.get('type', '') for e in room.get('equipment', [])]
        available = sum(1 for eq in required_equipment if eq in room_equipment)
        score += int(30 * (available / len(required_equipment)))
    else:
        score += 30  # No equipment requirements = full score

    # User history score (20 pts): prefer rooms user has booked before
    room_id = room.get('id')
    history_rooms = [h.get('room_id') for h in user_history]
    history_count = history_rooms.count(room_id)
    if history_count > 0:
        score += min(20, history_count * 5)

    # Floor/location preference (10 pts): prefer ground floor for large groups
    floor = room.get('floor', 0)
    if participants > 30 and floor == 0:
        score += 10
    elif participants <= 10:
        score += 8  # Small rooms usually well-suited on any floor

    return min(score, 100)


@recommendation_bp.route('/recommend', methods=['POST'])
def recommend_rooms():
    """
    POST /api/recommend
    Body: { userId, participants, equipmentTypes, startTime, endTime }
    Returns ranked list of rooms with relevance scores.
    """
    data = request.get_json() or {}
    user_id = data.get('userId')
    participants = data.get('participants', 1)
    equipment_types = data.get('equipmentTypes', [])
    start_time = data.get('startTime')
    end_time = data.get('endTime')

    # Fetch available rooms
    rooms_query = """
        SELECT r.id, r.name, r.capacity, r.location, r.floor, r.description, r.surface_area
        FROM rooms r
        WHERE r.is_active = TRUE AND r.capacity >= :participants
    """
    rooms = execute_query(rooms_query, {'participants': participants})

    if not rooms:
        return jsonify({'recommendations': [], 'message': 'Aucune salle disponible'})

    # Filter out conflicting reservations if times provided
    if start_time and end_time:
        conflict_query = """
            SELECT DISTINCT room_id FROM reservations
            WHERE status IN ('CONFIRMED', 'PENDING')
            AND start_time < :end_time AND end_time > :start_time
        """
        conflicts = execute_query(conflict_query, {'start_time': start_time, 'end_time': end_time})
        conflict_ids = {c['room_id'] for c in conflicts}
        rooms = [r for r in rooms if r['id'] not in conflict_ids]

    # Get user history
    user_history = []
    if user_id:
        history_query = """
            SELECT room_id, COUNT(*) as count FROM reservations
            WHERE user_id = :user_id AND status = 'COMPLETED'
            GROUP BY room_id ORDER BY count DESC LIMIT 20
        """
        user_history = execute_query(history_query, {'user_id': user_id})

    # Get equipment per room
    if rooms:
        room_ids = [r['id'] for r in rooms]
        placeholders = ','.join([str(rid) for rid in room_ids])
        eq_query = f"""
            SELECT equipment_id, name, type, room_id, status
            FROM equipment WHERE room_id IN ({placeholders}) AND status = 'AVAILABLE'
        """
        equipment_list = execute_query(eq_query)
        equipment_by_room = {}
        for eq in equipment_list:
            rid = eq['room_id']
            if rid not in equipment_by_room:
                equipment_by_room[rid] = []
            equipment_by_room[rid].append(eq)
        for room in rooms:
            room['equipment'] = equipment_by_room.get(room['id'], [])

    # Score and rank rooms
    requirements = {'participants': participants, 'equipmentTypes': equipment_types}
    scored = []
    for room in rooms:
        s = score_room(room, requirements, user_history)
        if s > 0 or participants <= room.get('capacity', 0):
            scored.append({**room, 'score': s, 'recommendation_reason': build_reason(room, requirements, s)})

    scored.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({
        'recommendations': scored[:5],
        'total': len(scored),
        'criteria': {'participants': participants, 'equipmentTypes': equipment_types}
    })


def build_reason(room, requirements, score):
    reasons = []
    if room.get('capacity', 0) >= requirements.get('participants', 0):
        ratio = room['capacity'] / max(requirements.get('participants', 1), 1)
        if ratio <= 1.5:
            reasons.append('Capacité parfaitement adaptée')
        elif ratio <= 2.5:
            reasons.append('Capacité suffisante')
    eq_types = [e['type'] for e in room.get('equipment', [])]
    for req_eq in requirements.get('equipmentTypes', []):
        if req_eq in eq_types:
            reasons.append(f'{req_eq.replace("_", " ").title()} disponible')
    if not reasons:
        reasons.append('Salle disponible')
    return ', '.join(reasons[:2])
