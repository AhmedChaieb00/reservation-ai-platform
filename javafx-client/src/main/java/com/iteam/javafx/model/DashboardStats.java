package com.iteam.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DashboardStats {
    private int totalRooms;
    private int activeRooms;
    private int totalReservations;
    private int pendingConfirmations;
    private int confirmedToday;
    private int totalUsers;

    public int getTotalRooms() { return totalRooms; }
    public void setTotalRooms(int totalRooms) { this.totalRooms = totalRooms; }
    public int getActiveRooms() { return activeRooms; }
    public void setActiveRooms(int activeRooms) { this.activeRooms = activeRooms; }
    public int getTotalReservations() { return totalReservations; }
    public void setTotalReservations(int totalReservations) { this.totalReservations = totalReservations; }
    public int getPendingConfirmations() { return pendingConfirmations; }
    public void setPendingConfirmations(int pendingConfirmations) { this.pendingConfirmations = pendingConfirmations; }
    public int getConfirmedToday() { return confirmedToday; }
    public void setConfirmedToday(int confirmedToday) { this.confirmedToday = confirmedToday; }
    public int getTotalUsers() { return totalUsers; }
    public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
}
