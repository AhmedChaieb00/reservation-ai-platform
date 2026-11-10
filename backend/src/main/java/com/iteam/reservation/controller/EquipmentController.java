package com.iteam.reservation.controller;

import com.iteam.reservation.entity.Equipment;
import com.iteam.reservation.entity.MaintenanceLog;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<List<Equipment>> getAll() {
        return ResponseEntity.ok(equipmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.findById(id));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Equipment>> getByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(equipmentService.findByRoom(roomId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Equipment> create(@RequestBody Equipment equipment) {
        return ResponseEntity.status(201).body(equipmentService.create(equipment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Equipment> update(@PathVariable Long id, @RequestBody Equipment equipment) {
        return ResponseEntity.ok(equipmentService.update(id, equipment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Équipement supprimé"));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<MaintenanceLog> reportIssue(@PathVariable Long id,
                                                       @RequestBody Map<String, String> body,
                                                       Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.status(201).body(
            equipmentService.reportIssue(id, body.get("description"), user.getId())
        );
    }

    @PutMapping("/maintenance/{logId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<MaintenanceLog> updateMaintenance(@PathVariable Long logId,
                                                             @RequestBody Map<String, String> body) {
        MaintenanceLog.MaintenanceStatus status = MaintenanceLog.MaintenanceStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(equipmentService.updateMaintenanceStatus(logId, status));
    }

    @GetMapping("/{id}/maintenance")
    public ResponseEntity<List<MaintenanceLog>> getMaintenanceLogs(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getMaintenanceLogs(id));
    }
}
