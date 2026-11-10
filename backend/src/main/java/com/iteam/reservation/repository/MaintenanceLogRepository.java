package com.iteam.reservation.repository;

import com.iteam.reservation.entity.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByEquipmentIdOrderByReportedAtDesc(Long equipmentId);
    List<MaintenanceLog> findByStatusOrderByReportedAtDesc(MaintenanceLog.MaintenanceStatus status);
    List<MaintenanceLog> findByReportedByIdOrderByReportedAtDesc(Long userId);
}
