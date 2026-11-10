-- ============================================================
-- Système de Gestion de Réservation pour Salles de Conférence
-- Database Initialization Script
-- ITEAM University - 2024-2025
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS reservation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reservation_db;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('USER', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'USER',
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(200),
    floor INT DEFAULT 0,
    surface_area DECIMAL(8,2),
    description TEXT,
    photo_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rooms_capacity (capacity),
    INDEX idx_rooms_active (is_active)
);

CREATE TABLE IF NOT EXISTS equipment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('PROJECTOR','MICROPHONE','WHITEBOARD','VIDEO_CONFERENCE','INTERACTIVE_SCREEN','OTHER') NOT NULL,
    room_id BIGINT,
    status ENUM('AVAILABLE','IN_USE','MAINTENANCE','OUT_OF_ORDER') NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    serial_number VARCHAR(100),
    purchase_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_equipment_room (room_id),
    INDEX idx_equipment_status (status)
);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    participants_count INT NOT NULL DEFAULT 1,
    status ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
    recurrence_type ENUM('NONE','DAILY','WEEKLY','MONTHLY') NOT NULL DEFAULT 'NONE',
    recurrence_end_date DATE,
    parent_reservation_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    INDEX idx_reservations_user (user_id),
    INDEX idx_reservations_room (room_id),
    INDEX idx_reservations_status (status),
    INDEX idx_reservations_time (start_time, end_time)
);

CREATE TABLE IF NOT EXISTS reservation_equipment (
    reservation_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    PRIMARY KEY (reservation_id, equipment_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    reservation_id BIGINT,
    type ENUM('CONFIRMATION','REMINDER','CANCELLATION','MODIFICATION','ADMIN_ALERT') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
);

CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    sentiment ENUM('POSITIVE','NEUTRAL','NEGATIVE'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_feedback (reservation_id, user_id)
);

CREATE TABLE IF NOT EXISTS maintenance_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    equipment_id BIGINT NOT NULL,
    reported_by BIGINT,
    description TEXT NOT NULL,
    status ENUM('REPORTED','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'REPORTED',
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_maintenance_equipment (equipment_id),
    INDEX idx_maintenance_status (status)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_time (created_at)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- DEMO USERS ONLY. All share the publicly known demo password documented in the README.
-- Never load this seed in production: change or delete these accounts first.
INSERT INTO users (email, password_hash, first_name, last_name, role, department, phone) VALUES
('admin@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Admin', 'Demo', 'ADMIN', 'Direction', '+216 20 000 001'),
('manager@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Manager', 'Demo', 'MANAGER', 'Informatique', '+216 20 000 002'),
('user1@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Fatma', 'Ben Ali', 'USER', 'Informatique', '+216 20 000 003'),
('user2@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Karim', 'Trabelsi', 'USER', 'Marketing', '+216 20 000 004'),
('user3@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Sarra', 'Mansour', 'USER', 'Finance', '+216 20 000 005'),
('user4@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Omar', 'Bouaziz', 'USER', 'RH', '+216 20 000 006'),
('manager2@iteam.tn', '$2a$12$JT.K9OQEyygHfxyaxwKDUe5ZecAwLoaG08cb7xYIok4Gi/Q./D3te', 'Leila', 'Gharbi', 'MANAGER', 'Marketing', '+216 20 000 007');

-- Rooms
INSERT INTO rooms (name, capacity, location, floor, surface_area, description) VALUES
('Salle Atlas', 20, 'Bâtiment A, Aile Nord', 1, 45.00, 'Salle de conférence équipée pour présentations et réunions d équipe. Climatisée avec éclairage modulable.'),
('Salle Méditerranée', 50, 'Bâtiment B, Aile Sud', 2, 120.00, 'Grande salle pour séminaires, formations et événements. Scène et système audio professionnel.'),
('Salle Innovation', 10, 'Bâtiment A, Aile Est', 0, 25.00, 'Petite salle créative avec tableaux blancs multiples. Idéale pour brainstorming et ateliers.'),
('Salle Direction', 12, 'Bâtiment C', 3, 30.00, 'Salle de réunion VIP avec équipement haut de gamme. Accès restreint.'),
('Amphithéâtre Ibn Khaldoun', 150, 'Bâtiment Principal', 0, 350.00, 'Grand amphithéâtre pour conférences, cours magistraux et événements institutionnels.'),
('Salle Carthage', 30, 'Bâtiment B, Aile Nord', 1, 70.00, 'Salle polyvalente avec disposition modulable. Parquet et acoustique optimisée.'),
('Salle Startup Lab', 15, 'Bâtiment D, Innovation Hub', 2, 40.00, 'Espace moderne dédié aux projets innovants avec équipements connectés.'),
('Salle des Travaux Pratiques', 25, 'Bâtiment E', 1, 60.00, 'Salle équipée pour les ateliers techniques et démonstrations pratiques.');

-- Equipment
INSERT INTO equipment (name, type, room_id, status, description, serial_number) VALUES
-- Salle Atlas (id=1)
('Projecteur Epson EB-X41', 'PROJECTOR', 1, 'AVAILABLE', 'Projecteur Full HD 3600 lumens', 'EPS-2024-001'),
('Micro sans fil Sennheiser', 'MICROPHONE', 1, 'AVAILABLE', 'Micro UHF avec récepteur', 'SEN-2024-001'),
('Tableau blanc interactif SMART', 'WHITEBOARD', 1, 'AVAILABLE', 'Tableau interactif 80 pouces', 'SMA-2024-001'),
-- Salle Méditerranée (id=2)
('Projecteur Epson EB-L200F', 'PROJECTOR', 2, 'AVAILABLE', 'Laser Full HD 4500 lumens', 'EPS-2024-002'),
('Système audio Yamaha', 'MICROPHONE', 2, 'AVAILABLE', 'Système conférence 8 micros', 'YAM-2024-001'),
('Système vidéoconférence Cisco', 'VIDEO_CONFERENCE', 2, 'AVAILABLE', 'Webex Room Kit Pro', 'CIS-2024-001'),
-- Salle Innovation (id=3)
('Écran interactif Samsung 65"', 'INTERACTIVE_SCREEN', 3, 'AVAILABLE', 'Écran tactile 4K avec stylet', 'SAM-2024-001'),
('Tableau blanc magnétique', 'WHITEBOARD', 3, 'AVAILABLE', 'Tableau 180x120cm avec accessoires', 'TBL-2024-001'),
-- Salle Direction (id=4)
('Cisco Webex Board 55', 'VIDEO_CONFERENCE', 4, 'AVAILABLE', 'Tout-en-un vidéo et collaboration', 'CIS-2024-002'),
('Micro de table Shure', 'MICROPHONE', 4, 'AVAILABLE', 'Micro de conférence omnidirectionnel', 'SHU-2024-001'),
-- Salle Carthage (id=6)
('Projecteur BenQ MW550', 'PROJECTOR', 6, 'AVAILABLE', 'WXGA 3600 lumens', 'BNQ-2024-001'),
('Système visioconférence Logitech', 'VIDEO_CONFERENCE', 6, 'MAINTENANCE', 'Logitech Rally Bar - en maintenance', 'LOG-2024-001'),
-- Salle Startup Lab (id=7)
('Écran interactif Promethean 75"', 'INTERACTIVE_SCREEN', 7, 'AVAILABLE', 'ActivPanel 9 75" 4K', 'PRO-2024-001'),
('Micro USB Blue Yeti', 'MICROPHONE', 7, 'AVAILABLE', 'Micro USB professionnel', 'BLU-2024-001');

-- Reservations (recent and upcoming)
INSERT INTO reservations (user_id, room_id, title, description, start_time, end_time, participants_count, status) VALUES
(3, 1, 'Réunion équipe développement', 'Sprint planning du Q2 2026', DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 8, 'CONFIRMED'),
(4, 2, 'Formation Marketing Digital', 'Formation avancée sur les réseaux sociaux', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 4 HOUR), 35, 'CONFIRMED'),
(5, 3, 'Atelier Brainstorming Innovation', 'Idéation nouveaux produits', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 2 HOUR), 8, 'PENDING'),
(6, 6, 'Réunion RH mensuelle', 'Point mensuel équipe RH', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 5 DAY), INTERVAL 2 HOUR), 12, 'CONFIRMED'),
(3, 7, 'Présentation projet Startup', 'Demo Day - projets innovants', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 7 DAY), INTERVAL 3 HOUR), 15, 'PENDING'),
(2, 4, 'Comité de Direction', 'Réunion mensuelle direction', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 10 DAY), INTERVAL 2 HOUR), 10, 'CONFIRMED'),
-- Past reservations for stats
(3, 1, 'Revue de code', 'Analyse code legacy', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 2 HOUR), 5, 'COMPLETED'),
(4, 2, 'Séminaire annuel', 'Bilan annuel département', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 6 HOUR), 40, 'COMPLETED'),
(5, 3, 'Workshop Design Thinking', 'Méthodologie innovation', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 3 HOUR), 9, 'COMPLETED'),
(6, 6, 'Formation Sécurité', 'Sensibilisation cybersécurité', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 14 DAY), INTERVAL 2 HOUR), 20, 'COMPLETED');

-- Notifications
INSERT INTO notifications (user_id, reservation_id, type, message, is_read) VALUES
(3, 1, 'CONFIRMATION', 'Votre réservation "Réunion équipe développement" a été confirmée pour le créneau demandé.', FALSE),
(4, 2, 'CONFIRMATION', 'Votre réservation "Formation Marketing Digital" a été confirmée.', TRUE),
(5, 3, 'ADMIN_ALERT', 'Votre réservation "Atelier Brainstorming Innovation" est en attente de validation.', FALSE),
(2, NULL, 'ADMIN_ALERT', 'Nouvelle réservation en attente de validation : "Atelier Brainstorming Innovation"', FALSE),
(3, 7, 'CONFIRMATION', 'Votre réservation est en cours de traitement.', FALSE);

-- Feedback
INSERT INTO feedback (reservation_id, user_id, rating, comment, sentiment) VALUES
(7, 3, 5, 'Excellente salle, très bien équipée. Tout fonctionnait parfaitement.', 'POSITIVE'),
(8, 4, 4, 'Bonne expérience globale. La climatisation était un peu forte.', 'POSITIVE'),
(9, 5, 3, 'Salle correcte mais projecteur défaillant pendant la réunion.', 'NEUTRAL'),
(10, 6, 4, 'Bonne salle pour les réunions de taille moyenne.', 'POSITIVE');

-- Maintenance logs
INSERT INTO maintenance_log (equipment_id, reported_by, description, status) VALUES
(12, 5, 'Le système de visioconférence Logitech ne démarre plus correctement. Écran noir au démarrage.', 'IN_PROGRESS');

-- Audit log
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES
(1, 'CREATE', 'Room', 1, 'Création de la salle Atlas'),
(1, 'CREATE', 'Room', 2, 'Création de la salle Méditerranée'),
(3, 'CREATE', 'Reservation', 1, 'Nouvelle réservation créée'),
(2, 'CONFIRM', 'Reservation', 1, 'Réservation confirmée par le gestionnaire'),
(2, 'CONFIRM', 'Reservation', 2, 'Réservation confirmée par le gestionnaire');
