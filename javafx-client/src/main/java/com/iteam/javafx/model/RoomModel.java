package com.iteam.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomModel {
    private Long id;
    private String name;
    private Integer capacity;
    private String location;
    private Integer floor;
    private String description;
    private Boolean isActive;
    private List<EquipmentModel> equipment;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    @JsonProperty("isActive")
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<EquipmentModel> getEquipment() { return equipment; }
    public void setEquipment(List<EquipmentModel> equipment) { this.equipment = equipment; }

    public String getStatusLabel() {
        return Boolean.TRUE.equals(isActive) ? "Disponible" : "Indisponible";
    }

    public String getEquipmentSummary() {
        if (equipment == null || equipment.isEmpty()) return "Aucun";
        return equipment.size() + " équipement(s)";
    }

    @Override
    public String toString() { return name != null ? name : "Salle #" + id; }
}
