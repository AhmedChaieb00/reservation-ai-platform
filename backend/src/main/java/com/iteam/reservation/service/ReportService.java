package com.iteam.reservation.service;

import com.iteam.reservation.dto.DashboardStatsDTO;
import com.iteam.reservation.entity.Reservation;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;

    public DashboardStatsDTO getDashboardStats() {
        long totalRooms = roomRepository.countByIsActiveTrue();
        long totalReservations = reservationRepository.count();
        long activeUsers = userRepository.findByIsActiveTrue().size();
        long todayReservations = reservationRepository.countTodayReservations();
        long pending = reservationRepository.countByStatus(Reservation.ReservationStatus.PENDING);
        long confirmed = reservationRepository.countByStatus(Reservation.ReservationStatus.CONFIRMED);
        long cancelled = reservationRepository.countByStatus(Reservation.ReservationStatus.CANCELLED);

        // Occupancy rate: (confirmed + completed) / total active * 100
        double occupancy = totalReservations > 0 ? Math.min(100.0, (confirmed + reservationRepository.countByStatus(Reservation.ReservationStatus.COMPLETED)) * 100.0 / Math.max(totalReservations, 1)) : 0.0;

        return new DashboardStatsDTO(totalRooms, totalReservations, activeUsers,
            todayReservations, Math.round(occupancy * 10.0) / 10.0, pending, confirmed, cancelled);
    }

    public Map<String, Object> getOccupancyStats() {
        List<Object[]> data = new ArrayList<>();
        List<Map<String, Object>> roomStats = new ArrayList<>();

        roomRepository.findByIsActiveTrue().forEach(room -> {
            List<Reservation> reservations = reservationRepository.findByRoomId(room.getId());
            long confirmed = reservations.stream()
                .filter(r -> r.getStatus() == Reservation.ReservationStatus.CONFIRMED
                          || r.getStatus() == Reservation.ReservationStatus.COMPLETED)
                .count();
            double avgRating = feedbackRepository.findAverageRatingByRoomId(room.getId()) != null
                ? feedbackRepository.findAverageRatingByRoomId(room.getId()) : 0.0;

            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("roomId", room.getId());
            stat.put("roomName", room.getName());
            stat.put("capacity", room.getCapacity());
            stat.put("totalReservations", reservations.size());
            stat.put("confirmedReservations", confirmed);
            stat.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
            roomStats.add(stat);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomOccupancy", roomStats);
        result.put("generatedAt", new Date());
        return result;
    }

    public Map<String, Object> getPeakHours() {
        Map<Integer, Long> hourCounts = new TreeMap<>();
        reservationRepository.findAll().stream()
            .filter(r -> r.getStatus() != Reservation.ReservationStatus.CANCELLED)
            .forEach(r -> {
                int hour = r.getStartTime().getHour();
                hourCounts.merge(hour, 1L, Long::sum);
            });

        List<Map<String, Object>> peakHours = new ArrayList<>();
        hourCounts.forEach((hour, count) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("hour", String.format("%02d:00", hour));
            entry.put("count", count);
            peakHours.add(entry);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("peakHours", peakHours);
        return result;
    }

    public Map<String, Object> getUserActivityStats() {
        List<Map<String, Object>> userStats = new ArrayList<>();
        userRepository.findAll().stream()
            .filter(u -> u.getIsActive() && u.getRole() == User.Role.USER)
            .forEach(user -> {
                List<Reservation> userReservations = reservationRepository.findByUserId(user.getId());
                if (!userReservations.isEmpty()) {
                    Map<String, Object> stat = new LinkedHashMap<>();
                    stat.put("userId", user.getId());
                    stat.put("userName", user.getFirstName() + " " + user.getLastName());
                    stat.put("department", user.getDepartment());
                    stat.put("totalReservations", userReservations.size());
                    stat.put("confirmedCount", userReservations.stream()
                        .filter(r -> r.getStatus() == Reservation.ReservationStatus.CONFIRMED
                                  || r.getStatus() == Reservation.ReservationStatus.COMPLETED)
                        .count());
                    userStats.add(stat);
                }
            });
        userStats.sort((a, b) -> Integer.compare(
            (Integer) b.get("totalReservations"), (Integer) a.get("totalReservations")));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userActivity", userStats.subList(0, Math.min(10, userStats.size())));
        return result;
    }
}
