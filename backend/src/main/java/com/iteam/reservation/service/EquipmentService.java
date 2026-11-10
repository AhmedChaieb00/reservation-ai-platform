package com.iteam.reservation.service;

import com.iteam.reservation.entity.Equipment;
import com.iteam.reservation.entity.MaintenanceLog;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.repository.EquipmentRepository;
import com.iteam.reservation.repository.MaintenanceLogRepository;
import com.iteam.reservation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final UserRepository userRepository;

    public List<Equipment> findAll() {
        return equipmentRepository.findAll();
    }

    public Equipment findById(Long id) {
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Équipement introuvable: " + id));
    }

    public List<Equipment> findByRoom(Long roomId) {
        return equipmentRepository.findByRoomId(roomId);
    }

    @Transactional
    public Equipment create(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment update(Long id, Equipment updates) {
        Equipment equipment = findById(id);
        if (updates.getName() != null) equipment.setName(updates.getName());
        if (updates.getType() != null) equipment.setType(updates.getType());
        if (updates.getStatus() != null) equipment.setStatus(updates.getStatus());
        if (updates.getDescription() != null) equipment.setDescription(updates.getDescription());
        if (updates.getSerialNumber() != null) equipment.setSerialNumber(updates.getSerialNumber());
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public void delete(Long id) {
        equipmentRepository.deleteById(id);
    }

    @Transactional
    public MaintenanceLog reportIssue(Long equipmentId, String description, Long userId) {
        Equipment equipment = findById(equipmentId);
        User reporter = userRepository.findById(userId).orElse(null);

        equipment.setStatus(Equipment.EquipmentStatus.MAINTENANCE);
        equipmentRepository.save(equipment);

        MaintenanceLog log = MaintenanceLog.builder()
            .equipment(equipment)
            .reportedBy(reporter)
            .description(description)
            .status(MaintenanceLog.MaintenanceStatus.REPORTED)
            .build();
        return maintenanceLogRepository.save(log);
    }

    @Transactional
    public MaintenanceLog updateMaintenanceStatus(Long logId, MaintenanceLog.MaintenanceStatus newStatus) {
        MaintenanceLog log = maintenanceLogRepository.findById(logId)
            .orElseThrow(() -> new NoSuchElementException("Log de maintenance introuvable"));
        log.setStatus(newStatus);
        if (newStatus == MaintenanceLog.MaintenanceStatus.RESOLVED) {
            log.setResolvedAt(LocalDateTime.now());
            log.getEquipment().setStatus(Equipment.EquipmentStatus.AVAILABLE);
            equipmentRepository.save(log.getEquipment());
        }
        return maintenanceLogRepository.save(log);
    }

    public List<MaintenanceLog> getMaintenanceLogs(Long equipmentId) {
        return maintenanceLogRepository.findByEquipmentIdOrderByReportedAtDesc(equipmentId);
    }
}
