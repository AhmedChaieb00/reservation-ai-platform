package com.iteam.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EquipmentModel {
    private Long id;
    private String name;
    private String type;
    private String status;
    private Long roomId;
    private String roomName;
    private String serialNumber;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getStatusLabel() {
        if (status == null) return "";
        return switch (status) {
            case "AVAILABLE" -> "Disponible";
            case "IN_USE" -> "En utilisation";
            case "MAINTENANCE" -> "Maintenance";
            case "BROKEN" -> "Défaillant";
            default -> status;
        };
    }

    @Override
    public String toString() { return name != null ? name : "Équipement #" + id; }
}
