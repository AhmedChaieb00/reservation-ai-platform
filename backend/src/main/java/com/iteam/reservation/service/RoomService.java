package com.iteam.reservation.service;

import com.iteam.reservation.entity.Room;
import com.iteam.reservation.repository.ReservationRepository;
import com.iteam.reservation.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    public List<Room> findAll() {
        return roomRepository.findByIsActiveTrue();
    }

    public List<Room> findAvailable(LocalDateTime startTime, LocalDateTime endTime, Integer minCapacity) {
        List<Room> rooms = minCapacity != null
            ? roomRepository.findByIsActiveTrueAndCapacityGreaterThanEqual(minCapacity)
            : roomRepository.findByIsActiveTrue();

        if (startTime != null && endTime != null) {
            final LocalDateTime start = startTime;
            final LocalDateTime end = endTime;
            rooms = rooms.stream()
                .filter(room -> reservationRepository.findConflicts(room.getId(), start, end, null).isEmpty())
                .collect(Collectors.toList());
        }
        return rooms;
    }

    public Room findById(Long id) {
        return roomRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Salle introuvable: " + id));
    }

    @Transactional
    public Room create(Room room) {
        return roomRepository.save(room);
    }

    @Transactional
    public Room update(Long id, Room updates) {
        Room room = findById(id);
        if (updates.getName() != null) room.setName(updates.getName());
        if (updates.getCapacity() != null) room.setCapacity(updates.getCapacity());
        if (updates.getLocation() != null) room.setLocation(updates.getLocation());
        if (updates.getFloor() != null) room.setFloor(updates.getFloor());
        if (updates.getSurfaceArea() != null) room.setSurfaceArea(updates.getSurfaceArea());
        if (updates.getDescription() != null) room.setDescription(updates.getDescription());
        if (updates.getPhotoUrl() != null) room.setPhotoUrl(updates.getPhotoUrl());
        if (updates.getIsActive() != null) room.setIsActive(updates.getIsActive());
        return roomRepository.save(room);
    }

    @Transactional
    public void delete(Long id) {
        Room room = findById(id);
        room.setIsActive(false);
        roomRepository.save(room);
    }

    public long count() {
        return roomRepository.countByIsActiveTrue();
    }
}
