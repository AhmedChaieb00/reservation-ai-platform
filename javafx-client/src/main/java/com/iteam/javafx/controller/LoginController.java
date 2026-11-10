package com.iteam.javafx.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iteam.javafx.ApiClient;
import com.iteam.javafx.App;
import com.iteam.javafx.SessionStore;
import com.iteam.javafx.model.UserModel;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;

import java.net.http.HttpResponse;

public class LoginController {

    @FXML private TextField emailField;
    @FXML private PasswordField passwordField;
    @FXML private Button loginBtn;
    @FXML private Label errorLabel;
    @FXML private ProgressIndicator spinner;
    @FXML private HBox errorBox;

    private final ObjectMapper mapper = new ObjectMapper();

    @FXML
    public void initialize() {
        errorBox.setVisible(false);
        spinner.setVisible(false);
        emailField.setOnAction(e -> passwordField.requestFocus());
        passwordField.setOnAction(e -> handleLogin());
    }

    @FXML
    public void handleLogin() {
        String email = emailField.getText().trim();
        String password = passwordField.getText();

        if (email.isEmpty() || password.isEmpty()) {
            showError("Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);
        new Thread(() -> {
            try {
                String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}",
                        email.replace("\"", ""), password.replace("\"", ""));
                HttpResponse<String> resp = ApiClient.post("/auth/login", body);

                Platform.runLater(() -> {
                    setLoading(false);
                    if (resp.statusCode() == 200) {
                        try {
                            JsonNode root = mapper.readTree(resp.body());
                            String token = root.path("token").asText();
                            UserModel user = mapper.treeToValue(root.path("user"), UserModel.class);
                            SessionStore.get().setToken(token);
                            SessionStore.get().setCurrentUser(user);
                            App.showMain();
                        } catch (Exception ex) {
                            showError("Erreur lors du traitement de la réponse.");
                        }
                    } else if (resp.statusCode() == 401) {
                        showError("Email ou mot de passe incorrect.");
                    } else {
                        showError("Erreur serveur (" + resp.statusCode() + "). Vérifiez que le backend est démarré.");
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> {
                    setLoading(false);
                    showError("Impossible de joindre le serveur (localhost:8080). Vérifiez que Docker est démarré.");
                });
            }
        }).start();
    }

    @FXML
    public void fillAdmin() { fill("admin@iteam.tn", "Admin@123"); }
    @FXML
    public void fillManager() { fill("manager@iteam.tn", "Admin@123"); }
    @FXML
    public void fillUser() { fill("user1@iteam.tn", "Admin@123"); }

    private void fill(String email, String password) {
        emailField.setText(email);
        passwordField.setText(password);
        errorBox.setVisible(false);
    }

    private void showError(String msg) {
        errorLabel.setText(msg);
        errorBox.setVisible(true);
    }

    private void setLoading(boolean loading) {
        loginBtn.setDisable(loading);
        spinner.setVisible(loading);
        emailField.setDisable(loading);
        passwordField.setDisable(loading);
    }
}
