package com.iteam.javafx;

import com.iteam.javafx.model.UserModel;

public class SessionStore {

    private static SessionStore instance;
    private String token;
    private UserModel currentUser;

    private SessionStore() {}

    public static SessionStore get() {
        if (instance == null) instance = new SessionStore();
        return instance;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserModel getCurrentUser() { return currentUser; }
    public void setCurrentUser(UserModel user) { this.currentUser = user; }

    public boolean isLoggedIn() { return token != null && !token.isEmpty(); }

    public boolean isAdmin() {
        return currentUser != null && "ADMIN".equals(currentUser.getRole());
    }

    public boolean isManager() {
        return currentUser != null &&
               ("MANAGER".equals(currentUser.getRole()) || "ADMIN".equals(currentUser.getRole()));
    }

    public void clear() {
        token = null;
        currentUser = null;
    }
}
