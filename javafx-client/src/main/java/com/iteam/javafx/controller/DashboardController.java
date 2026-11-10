package com.iteam.javafx.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iteam.javafx.ApiClient;
import com.iteam.javafx.SessionStore;
import com.iteam.javafx.model.ReservationModel;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;

import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

public class DashboardController {

    @FXML private Label greetingLabel;
    @FXML private Label statRooms;
    @FXML private Label statReservations;
    @FXML private Label statPending;
    @FXML private Label statUsers;
    @FXML private VBox pendingAlert;

    @FXML private TableView<ReservationModel> todayTable;
    @FXML private TableColumn<ReservationModel, String> colTitle;
    @FXML private TableColumn<ReservationModel, String> colRoom;
    @FXML private TableColumn<ReservationModel, String> colDate;
    @FXML private TableColumn<ReservationModel, String> colStatus;

    private final ObjectMapper mapper = new ObjectMapper();

    @FXML
    public void initialize() {
        var user = SessionStore.get().getCurrentUser();
        greetingLabel.setText("Bonjour, " + (user != null ? user.getName() : "Utilisateur") + " !");

        colTitle.setCellValueFactory(new PropertyValueFactory<>("title"));
        colRoom.setCellValueFactory(new PropertyValueFactory<>("roomName"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("formattedDate"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("statusLabel"));

        colStatus.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setStyle(""); return; }
                setText(item);
                setStyle(switch (item) {
                    case "Confirmée" -> "-fx-text-fill: #16a34a; -fx-font-weight: bold;";
                    case "En attente" -> "-fx-text-fill: #d97706; -fx-font-weight: bold;";
                    default -> "-fx-text-fill: #dc2626;";
                });
            }
        });

        pendingAlert.setVisible(false);
        loadStats();
        loadTodayReservations();
    }

    private void loadStats() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/reports/dashboard");
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        try {
                            JsonNode root = mapper.readTree(resp.body());
                            statRooms.setText(String.valueOf(root.path("totalRooms").asInt(0)));
                            statReservations.setText(String.valueOf(root.path("totalReservations").asInt(0)));
                            int pending = root.path("pendingConfirmations").asInt(0);
                            statPending.setText(String.valueOf(pending));
                            statUsers.setText(String.valueOf(root.path("totalUsers").asInt(0)));
                            if (pending > 0 && SessionStore.get().isManager()) {
                                pendingAlert.setVisible(true);
                            }
                        } catch (Exception e) { /* ignore */ }
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    statRooms.setText("—");
                    statReservations.setText("—");
                    statPending.setText("—");
                    statUsers.setText("—");
                });
            }
        }).start();
    }

    private void loadTodayReservations() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/reservations/today");
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        try {
                            List<ReservationModel> list = mapper.readValue(
                                    resp.body(),
                                    mapper.getTypeFactory().constructCollectionType(List.class, ReservationModel.class)
                            );
                            todayTable.getItems().setAll(list);
                        } catch (Exception e) { /* ignore */ }
                    }
                });
            } catch (Exception ignored) {}
        }).start();
    }
}
