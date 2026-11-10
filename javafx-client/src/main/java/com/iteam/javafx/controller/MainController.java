package com.iteam.javafx.controller;

import com.iteam.javafx.App;
import com.iteam.javafx.SessionStore;
import com.iteam.javafx.model.UserModel;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.*;

import java.io.IOException;

public class MainController {

    @FXML private StackPane contentArea;
    @FXML private Label userNameLabel;
    @FXML private Label userRoleLabel;
    @FXML private VBox navDashboard;
    @FXML private VBox navRooms;
    @FXML private VBox navReservations;
    @FXML private VBox navEquipment;

    private VBox activeNav;

    @FXML
    public void initialize() {
        UserModel user = SessionStore.get().getCurrentUser();
        if (user != null) {
            userNameLabel.setText(user.getName());
            userRoleLabel.setText(user.getRoleLabel());
        }
        navigateTo("dashboard");
        setActiveNav(navDashboard);
    }

    @FXML public void onNavDashboard() { navigateTo("dashboard"); setActiveNav(navDashboard); }
    @FXML public void onNavRooms() { navigateTo("rooms"); setActiveNav(navRooms); }
    @FXML public void onNavReservations() { navigateTo("reservations"); setActiveNav(navReservations); }
    @FXML public void onNavEquipment() { navigateTo("equipment"); setActiveNav(navEquipment); }

    @FXML
    public void onLogout() {
        SessionStore.get().clear();
        try {
            App.showLogin();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void navigateTo(String view) {
        try {
            FXMLLoader loader = new FXMLLoader(App.class.getResource(view + ".fxml"));
            Node content = loader.load();
            contentArea.getChildren().setAll(content);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void setActiveNav(VBox nav) {
        if (activeNav != null) activeNav.getStyleClass().remove("nav-item-active");
        activeNav = nav;
        if (nav != null) nav.getStyleClass().add("nav-item-active");
    }
}
