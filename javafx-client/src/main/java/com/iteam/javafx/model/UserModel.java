package com.iteam.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserModel {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String department;
    private String phone;
    private String token;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRoleLabel() {
        if (role == null) return "";
        return switch (role) {
            case "ADMIN" -> "Administrateur";
            case "MANAGER" -> "Responsable";
            default -> "Utilisateur";
        };
    }

    @Override
    public String toString() { return name != null ? name : email; }
}
