package com.iteam.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservationModel {
    private Long id;
    private String title;
    private String purpose;
    private String startTime;
    private String endTime;
    private String status;
    private Integer attendeesCount;
    private Long roomId;
    private String roomName;
    private Long userId;
    private String userName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAttendeesCount() { return attendeesCount; }
    public void setAttendeesCount(Integer attendeesCount) { this.attendeesCount = attendeesCount; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getStatusLabel() {
        if (status == null) return "";
        return switch (status) {
            case "CONFIRMED" -> "Confirmée";
            case "PENDING" -> "En attente";
            case "CANCELLED" -> "Annulée";
            default -> status;
        };
    }

    public String getFormattedDate() {
        if (startTime == null) return "";
        try {
            String date = startTime.substring(0, 10);
            String start = startTime.length() >= 16 ? startTime.substring(11, 16) : "";
            String end = endTime != null && endTime.length() >= 16 ? endTime.substring(11, 16) : "";
            return date + " | " + start + " → " + end;
        } catch (Exception e) {
            return startTime;
        }
    }
}
