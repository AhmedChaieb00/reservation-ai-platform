package com.iteam.javafx.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iteam.javafx.ApiClient;
import com.iteam.javafx.SessionStore;
import com.iteam.javafx.model.RoomModel;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;

import java.net.http.HttpResponse;
import java.util.List;

public class RoomsController {

    @FXML private TableView<RoomModel> roomTable;
    @FXML private TableColumn<RoomModel, String> colName;
    @FXML private TableColumn<RoomModel, Integer> colCapacity;
    @FXML private TableColumn<RoomModel, String> colLocation;
    @FXML private TableColumn<RoomModel, Integer> colFloor;
    @FXML private TableColumn<RoomModel, String> colStatus;
    @FXML private TableColumn<RoomModel, String> colEquipment;

    @FXML private TextField searchField;
    @FXML private Spinner<Integer> capacityFilter;
    @FXML private Label detailName;
    @FXML private Label detailCapacity;
    @FXML private Label detailLocation;
    @FXML private Label detailFloor;
    @FXML private Label detailStatus;
    @FXML private Label detailEquipment;
    @FXML private TextArea detailDescription;
    @FXML private VBox detailPane;
    @FXML private Label roomCountLabel;

    private final ObservableList<RoomModel> rooms = FXCollections.observableArrayList();
    private FilteredList<RoomModel> filtered;
    private final ObjectMapper mapper = new ObjectMapper();

    @FXML
    public void initialize() {
        colName.setCellValueFactory(new PropertyValueFactory<>("name"));
        colCapacity.setCellValueFactory(new PropertyValueFactory<>("capacity"));
        colLocation.setCellValueFactory(new PropertyValueFactory<>("location"));
        colFloor.setCellValueFactory(new PropertyValueFactory<>("floor"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("statusLabel"));
        colEquipment.setCellValueFactory(new PropertyValueFactory<>("equipmentSummary"));

        colStatus.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setStyle(""); return; }
                setText(item);
                setStyle("Disponible".equals(item)
                        ? "-fx-text-fill: #16a34a; -fx-font-weight: bold;"
                        : "-fx-text-fill: #dc2626; -fx-font-weight: bold;");
            }
        });

        filtered = new FilteredList<>(rooms, p -> true);
        roomTable.setItems(filtered);

        SpinnerValueFactory.IntegerSpinnerValueFactory factory =
                new SpinnerValueFactory.IntegerSpinnerValueFactory(0, 500, 0, 5);
        capacityFilter.setValueFactory(factory);

        searchField.textProperty().addListener((obs, o, n) -> applyFilter());
        capacityFilter.valueProperty().addListener((obs, o, n) -> applyFilter());

        detailPane.setVisible(false);

        roomTable.getSelectionModel().selectedItemProperty().addListener((obs, o, room) -> {
            if (room != null) showDetail(room);
        });

        loadRooms();
    }

    private void applyFilter() {
        String query = searchField.getText().toLowerCase().trim();
        int minCap = capacityFilter.getValue();
        filtered.setPredicate(r -> {
            boolean matchName = query.isEmpty()
                    || (r.getName() != null && r.getName().toLowerCase().contains(query))
                    || (r.getLocation() != null && r.getLocation().toLowerCase().contains(query));
            boolean matchCap = r.getCapacity() != null && r.getCapacity() >= minCap;
            return matchName && matchCap;
        });
        roomCountLabel.setText(filtered.size() + " salle(s)");
    }

    private void showDetail(RoomModel r) {
        detailPane.setVisible(true);
        detailName.setText(r.getName());
        detailCapacity.setText(r.getCapacity() + " personnes");
        detailLocation.setText(r.getLocation());
        detailFloor.setText("Étage " + r.getFloor());
        detailStatus.setText(r.getStatusLabel());
        detailEquipment.setText(r.getEquipmentSummary());
        detailDescription.setText(r.getDescription() != null ? r.getDescription() : "Aucune description.");
    }

    @FXML
    public void onRefresh() { loadRooms(); }

    @FXML
    public void onClearFilter() {
        searchField.clear();
        capacityFilter.getValueFactory().setValue(0);
    }

    private void loadRooms() {
        new Thread(() -> {
            try {
                HttpResponse<String> resp = ApiClient.get("/rooms");
                Platform.runLater(() -> {
                    if (resp.statusCode() == 200) {
                        try {
                            List<RoomModel> list = mapper.readValue(
                                    resp.body(),
                                    mapper.getTypeFactory().constructCollectionType(List.class, RoomModel.class)
                            );
                            rooms.setAll(list);
                            roomCountLabel.setText(list.size() + " salle(s)");
                        } catch (Exception e) { e.printStackTrace(); }
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Erreur",
                        "Impossible de charger les salles."));
            }
        }).start();
    }

    private void showAlert(Alert.AlertType type, String title, String msg) {
        Alert alert = new Alert(type, msg, ButtonType.OK);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.showAndWait();
    }
}
