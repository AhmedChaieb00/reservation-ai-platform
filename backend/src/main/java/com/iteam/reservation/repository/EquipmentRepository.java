package com.iteam.reservation.repository;

import com.iteam.reservation.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByRoomId(Long roomId);
    List<Equipment> findByStatus(Equipment.EquipmentStatus status);
    List<Equipment> findByRoomIdAndStatus(Long roomId, Equipment.EquipmentStatus status);
    List<Equipment> findByType(Equipment.EquipmentType type);
}
