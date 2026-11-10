package com.iteam.javafx.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iteam.javafx.ApiClient;
import com.iteam.javafx.SessionStore;
import com.iteam.javafx.model.ReservationModel;
import com.iteam.javafx.model.RoomModel;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;

import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

public class ReservationsController {

    @FXML private TableView<ReservationModel> table;
    @FXML private TableColumn<ReservationModel, String> colTitle;
    @FXML private TableColumn<ReservationModel, String> colRoom;
    @FXML private TableColumn<ReservationModel, String> colDate;
    @FXML private TableColumn<ReservationModel, String> colStatus;
    @FXML private TableColumn<ReservationModel, String> colUser;
    @FXML private Label countLabel;
    @FXML private ComboBox<String> statusFilter;
    @FXML private Button confirmBtn;
    @FXML private Button cancelBtn;

    private final ObservableList<ReservationModel> reservations = FXCollections.observableArrayList();
    private FilteredList<ReservationModel> filtered;
    private List<RoomModel> availableRooms;
    private final ObjectMapper mapper = new ObjectMapper();

    @FXML
    public void initialize() {
        colTitle.setCellValueFactory(new PropertyValueFactory<>("title"));
        colRoom.setCellValueFactory(new PropertyValueFactory<>("roomName"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("formattedDate"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("statusLabel"));
        colUser.setCellValueFactory(new PropertyValueFactory<>("userName"));

        colStatus.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setStyle(""); return; }
                setText(item);
                setStyle(switch (item) {
                    case "Confirmée" -> "-fx-text-fill: #16a34a; -fx-font-weight: bold;";
                    case "En attente" -> "-fx-text-fill: #d97706; -fx-font-weight: bold;";
                    default -> "-fx-text-fill: #dc2626; -fx-font-weight: bold;";
                });
            }
        });

        statusFilter.setItems(FXCollections.observableArrayList("Toutes", "En attente", "Confirmée", "Annulée"));
        statusFilter.setValue("Toutes");

        filtered = new FilteredList<>(reservations, p -> true);
        table.setItems(filtered);

        statusFilter.valueProperty().addListener((obs, o, n) -> applyFilter());

        confirmBtn.setVisible(SessionStore.get().isManager());
        table.getSelectionModel().selectedItemProperty().addListener((obs, o, r) -> {
            boolean selected = r != null;
            cancelBtn.setDisable(!selected);
            if (confirmBtn.isVisible())
                confirmBtn.setDisable(!selected || !"PENDING".equals(r != null ? r.getStatus() : ""));
        });
        cancelBtn.setDisable(true);
        confirmBtn.setDisable(true);

        loadReservations();
        loadRooms();
    }

    private void applyFilter() {
        String f = statusFilter.getValue();
        filtered.setPredicate(r -> {
            if ("Toutes".equals(f)) return true;
            return f.equals(r.getStatusLabel());
        });
        countLabel.setText(filtered.size() + " réservation(s)");
    }

    @FXML
    public void onRefresh() { loadReservations(); }

    @FXML
    public void onConfirm() {
        ReservationModel r = table.getSelectionModel().getSelectedItem();
        if (r == null) return;
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.put("/reservations/" + r.getId() + "/confirm", null);
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        loadReservations();
                        showAlert(Alert.AlertType.INFORMATION, "Succès", "Réservation confirmée.");
                    } else {
                        showAlert(Alert.AlertType.ERROR, "Erreur", "Impossible de confirmer la réservation.");
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Erreur", e.getMessage()));
            }
        }).start();
    }

    @FXML
    public void onCancel() {
        ReservationModel r = table.getSelectionModel().getSelectedItem();
        if (r == null) return;
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Annuler la réservation \"" + r.getTitle() + "\" ?", ButtonType.YES, ButtonType.NO);
        confirm.setHeaderText(null);
        confirm.setTitle("Confirmation");
        Optional<ButtonType> result = confirm.showAndWait();
        if (result.isEmpty() || result.get() != ButtonType.YES) return;

        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.delete("/reservations/" + r.getId());
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200 || resp.statusCode() == 204) {
                        loadReservations();
                    } else {
                        showAlert(Alert.AlertType.ERROR, "Erreur", "Impossible d'annuler la réservation.");
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Erreur", e.getMessage()));
            }
        }).start();
    }

    @FXML
    public void onCreate() {
        if (availableRooms == null || availableRooms.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "Attention", "Chargement des salles en cours, réessayez.");
            return;
        }

        Dialog<ButtonType> dialog = new Dialog<>();
        dialog.setTitle("Nouvelle réservation");
        dialog.setHeaderText("Créer une réservation");
        dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);

        GridPane grid = new GridPane();
        grid.setHgap(12); grid.setVgap(10);
        grid.setStyle("-fx-padding: 20;");

        TextField titleField = new TextField();
        titleField.setPromptText("Titre de la réunion");
        ComboBox<RoomModel> roomBox = new ComboBox<>(FXCollections.observableArrayList(availableRooms));
        roomBox.setPromptText("Sélectionner une salle");
        DatePicker datePicker = new DatePicker(LocalDate.now().plusDays(1));
        ComboBox<String> startTime = new ComboBox<>(FXCollections.observableArrayList(
                "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
                "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
                "16:00","16:30","17:00","17:30"));
        startTime.setValue("09:00");
        ComboBox<String> endTime = new ComboBox<>(FXCollections.observableArrayList(
                "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
                "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
                "17:00","17:30","18:00","18:30"));
        endTime.setValue("10:00");
        Spinner<Integer> attendees = new Spinner<>(1, 200, 10);
        TextArea purpose = new TextArea();
        purpose.setPromptText("Objet de la réunion (optionnel)");
        purpose.setPrefRowCount(2);

        grid.add(new Label("Titre *"), 0, 0); grid.add(titleField, 1, 0);
        grid.add(new Label("Salle *"), 0, 1); grid.add(roomBox, 1, 1);
        grid.add(new Label("Date *"), 0, 2); grid.add(datePicker, 1, 2);
        grid.add(new Label("Début *"), 0, 3); grid.add(startTime, 1, 3);
        grid.add(new Label("Fin *"), 0, 4); grid.add(endTime, 1, 4);
        grid.add(new Label("Participants"), 0, 5); grid.add(attendees, 1, 5);
        grid.add(new Label("Objet"), 0, 6); grid.add(purpose, 1, 6);

        dialog.getDialogPane().setContent(grid);
        Platform.runLater(titleField::requestFocus);

        Optional<ButtonType> res = dialog.showAndWait();
        if (res.isEmpty() || res.get() != ButtonType.OK) return;

        String title = titleField.getText().trim();
        RoomModel room = roomBox.getValue();
        if (title.isEmpty() || room == null || datePicker.getValue() == null) {
            showAlert(Alert.AlertType.WARNING, "Champs manquants", "Titre, salle et date sont obligatoires.");
            return;
        }

        String date = datePicker.getValue().toString();
        String start = date + "T" + startTime.getValue() + ":00";
        String end = date + "T" + endTime.getValue() + ":00";
        String purposeText = purpose.getText().trim();

        String body = String.format(
                "{\"title\":\"%s\",\"roomId\":%d,\"startTime\":\"%s\",\"endTime\":\"%s\",\"attendeesCount\":%d,\"purpose\":\"%s\"}",
                title.replace("\"", ""), room.getId(), start, end,
                attendees.getValue(), purposeText.replace("\"", "")
        );

        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.post("/reservations", body);
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                        loadReservations();
                        showAlert(Alert.AlertType.INFORMATION, "Succès",
                                "Réservation créée. En attente de confirmation par un responsable.");
                    } else {
                        showAlert(Alert.AlertType.ERROR, "Erreur",
                                "Impossible de créer la réservation.\n" + resp.body());
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Erreur", e.getMessage()));
            }
        }).start();
    }

    private void loadReservations() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/reservations");
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        try {
                            List<ReservationModel> list = mapper.readValue(
                                    resp.body(),
                                    mapper.getTypeFactory().constructCollectionType(List.class, ReservationModel.class)
                            );
                            reservations.setAll(list);
                            countLabel.setText(list.size() + " réservation(s)");
                            applyFilter();
                        } catch (Exception e) { e.printStackTrace(); }
                    }
                });
            } catch (Exception ignored) {}
        }).start();
    }

    private void loadRooms() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/rooms");
                if (resp.statusCode() == 200) {
                    availableRooms = mapper.readValue(
                            resp.body(),
                            mapper.getTypeFactory().constructCollectionType(List.class, RoomModel.class)
                    );
                }
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
