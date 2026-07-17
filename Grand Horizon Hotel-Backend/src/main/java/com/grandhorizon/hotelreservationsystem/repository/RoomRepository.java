package com.grandhorizon.hotelreservationsystem.repository;

import com.grandhorizon.hotelreservationsystem.entity.Room;
import com.grandhorizon.hotelreservationsystem.entity.RoomStatus;
import com.grandhorizon.hotelreservationsystem.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    // Listing queries filter isDeleted explicitly here rather than via a
    // class-level @Where on Room (see the entity's javadoc for why) - a
    // soft-deleted room simply stops appearing in these "what can a guest
    // book" results, without affecting direct findById lookups used when
    // resolving a historical Booking's room association.
    List<Room> findByIsDeletedFalse();

    long countByIsDeletedFalse();

    List<Room> findByStatusAndIsDeletedFalse(RoomStatus status);

    List<Room> findByTypeAndIsDeletedFalse(RoomType type);

    List<Room> findByTypeAndStatusAndIsDeletedFalse(RoomType type, RoomStatus status);
}
