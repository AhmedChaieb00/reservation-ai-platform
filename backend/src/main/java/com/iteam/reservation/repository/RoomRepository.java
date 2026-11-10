package com.iteam.reservation.repository;

import com.iteam.reservation.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByIsActiveTrue();
    List<Room> findByIsActiveTrueAndCapacityGreaterThanEqual(Integer capacity);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Room> searchByName(@Param("keyword") String keyword);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.capacity >= :minCapacity ORDER BY r.capacity ASC")
    List<Room> findAvailableByCapacity(@Param("minCapacity") Integer minCapacity);

    long countByIsActiveTrue();
}
