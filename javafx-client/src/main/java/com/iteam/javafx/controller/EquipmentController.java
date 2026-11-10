package com.iteam.javafx.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iteam.javafx.ApiClient;
import com.iteam.javafx.model.EquipmentModel;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;

import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;

public class EquipmentController {

    @FXML private TableView<EquipmentModel> table;
    @FXML private TableColumn<EquipmentModel, String> colName;
    @FXML private TableColumn<EquipmentModel, String> colType;
    @FXML private TableColumn<EquipmentModel, String> colRoom;
    @FXML private TableColumn<EquipmentModel, String> colStatus;
    @FXML private TableColumn<EquipmentModel, String> colSerial;
    @FXML private TextField searchField;
    @FXML private ComboBox<String> typeFilter;
    @FXML private Label countLabel;

    private final ObservableList<EquipmentModel> items = FXCollections.observableArrayList();
    private FilteredList<EquipmentModel> filtered;
    private final ObjectMapper mapper = new ObjectMapper();

    @FXML
    public void initialize() {
        colName.setCellValueFactory(new PropertyValueFactory<>("name"));
        colType.setCellValueFactory(new PropertyValueFactory<>("type"));
        colRoom.setCellValueFactory(new PropertyValueFactory<>("roomName"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("statusLabel"));
        colSerial.setCellValueFactory(new PropertyValueFactory<>("serialNumber"));

        colStatus.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setStyle(""); return; }
                setText(item);
                setStyle(switch (item) {
                    case "Disponible" -> "-fx-text-fill: #16a34a; -fx-font-weight: bold;";
                    case "En utilisation" -> "-fx-text-fill: #2563eb; -fx-font-weight: bold;";
                    case "Maintenance" -> "-fx-text-fill: #d97706; -fx-font-weight: bold;";
                    default -> "-fx-text-fill: #dc2626; -fx-font-weight: bold;";
                });
            }
        });

        typeFilter.setItems(FXCollections.observableArrayList(
                "Tous", "PROJECTOR", "MICROPHONE", "WHITEBOARD", "VIDEO_CONFERENCE", "SCREEN", "OTHER"
        ));
        typeFilter.setValue("Tous");

        filtered = new FilteredList<>(items, p -> true);
        table.setItems(filtered);

        searchField.textProperty().addListener((obs, o, n) -> applyFilter());
        typeFilter.valueProperty().addListener((obs, o, n) -> applyFilter());

        loadEquipment();
    }

    private void applyFilter() {
        String q = searchField.getText().toLowerCase().trim();
        String t = typeFilter.getValue();
        filtered.setPredicate(e -> {
            boolean matchSearch = q.isEmpty()
                    || (e.getName() != null && e.getName().toLowerCase().contains(q))
                    || (e.getRoomName() != null && e.getRoomName().toLowerCase().contains(q));
            boolean matchType = "Tous".equals(t) || t.equals(e.getType());
            return matchSearch && matchType;
        });
        countLabel.setText(filtered.size() + " équipement(s)");
    }

    @FXML
    public void onRefresh() { loadEquipment(); }

    @FXML
    public void onReportIssue() {
        EquipmentModel eq = table.getSelectionModel().getSelectedItem();
        if (eq == null) {
            showAlert(Alert.AlertType.WARNING, "Sélection", "Sélectionnez un équipement.");
            return;
        }

        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Signaler un problème");
        dialog.setHeaderText("Équipement : " + eq.getName());
        dialog.setContentText("Description du problème :");
        Optional<String> result = dialog.showAndWait();
        if (result.isEmpty() || result.get().trim().isEmpty()) return;

        String description = result.get().trim();
        new Thread(() -> {
            try {
                String body = "{\"description\":\"" + description.replace("\"", "") + "\"}";
                HttpResponse<String> resp = ApiClient.post("/equipment/" + eq.getId() + "/report", body);
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                        showAlert(Alert.AlertType.INFORMATION, "Signalé",
                                "Problème signalé. L'équipe technique sera notifiée.");
                        loadEquipment();
                    } else {
                        showAlert(Alert.AlertType.ERROR, "Erreur", "Impossible de signaler le problème.");
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Erreur", e.getMessage()));
            }
        }).start();
    }

    private void loadEquipment() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/equipment");
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        try {
                            List<EquipmentModel> list = mapper.readValue(
                                    resp.body(),
                                    mapper.getTypeFactory().constructCollectionType(List.class, EquipmentModel.class)
                            );
                            items.setAll(list);
                            countLabel.setText(list.size() + " équipement(s)");
                        } catch (Exception e) { e.printStackTrace(); }
                    }
                });
            } catch (Exception ignored) {}
        }).start();
    }

    private void showAlert(Alert.AlertType type, String title, String msg) {
        Alert alert = new Alert(type, msg, ButtonType.OK);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.showAndWait();
    }
}
