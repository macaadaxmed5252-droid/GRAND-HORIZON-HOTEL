package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.dto.request.RoomRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.RoomResponse;
import com.grandhorizon.hotelreservationsystem.entity.Room;
import com.grandhorizon.hotelreservationsystem.entity.RoomStatus;
import com.grandhorizon.hotelreservationsystem.entity.RoomType;
import com.grandhorizon.hotelreservationsystem.exception.ResourceNotFoundException;
import com.grandhorizon.hotelreservationsystem.repository.RoomRepository;
import com.grandhorizon.hotelreservationsystem.service.FileStorageService;
import com.grandhorizon.hotelreservationsystem.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * Transactional CRUD operations for admin room management, plus filterable
 * read access for public room listings. Room images are written to local
 * disk via {@link FileStorageService} before the entity is persisted, so a
 * failed upload never leaves a room record pointing at a non-existent file.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final FileStorageService fileStorageService;

    @Override
    public List<RoomResponse> getAllRooms(RoomType type, RoomStatus status) {
        List<Room> rooms;
        if (type != null && status != null) {
            rooms = roomRepository.findByTypeAndStatusAndIsDeletedFalse(type, status);
        } else if (type != null) {
            rooms = roomRepository.findByTypeAndIsDeletedFalse(type);
        } else if (status != null) {
            rooms = roomRepository.findByStatusAndIsDeletedFalse(status);
        } else {
            rooms = roomRepository.findByIsDeletedFalse();
        }
        return rooms.stream().map(this::toResponse).toList();
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        return toResponse(findRoomOrThrow(id));
    }

    @Override
    @Transactional
    public RoomResponse createRoom(RoomRequest request, MultipartFile image) {
        String imageUrl = fileStorageService.storeRoomImage(image);

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .type(request.getType())
                .pricePerNight(request.getPricePerNight())
                .status(RoomStatus.AVAILABLE)
                .title(request.getTitle())
                .description(request.getDescription())
                .amenities(request.getAmenities() != null ? request.getAmenities() : new ArrayList<>())
                .rating(request.getRating())
                .imageUrl(imageUrl)
                .build();

        return toResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request, MultipartFile image) {
        Room room = findRoomOrThrow(id);
        room.setRoomNumber(request.getRoomNumber());
        room.setType(request.getType());
        room.setPricePerNight(request.getPricePerNight());
        room.setTitle(request.getTitle());
        room.setDescription(request.getDescription());
        room.setAmenities(request.getAmenities() != null ? request.getAmenities() : new ArrayList<>());
        room.setRating(request.getRating());

        if (image != null && !image.isEmpty()) {
            String previousImageUrl = room.getImageUrl();
            room.setImageUrl(fileStorageService.storeRoomImage(image));
            fileStorageService.deleteRoomImage(previousImageUrl);
        }

        return toResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        // Soft delete via @SQLDelete on Room (flips is_deleted=true instead
        // of physically removing the row) - so this is now always safe
        // regardless of booking history, and no longer needs a has-bookings
        // guard. The image is deliberately left on disk: historical
        // bookings' embedded room summary still shows the photo.
        Room room = findRoomOrThrow(id);
        roomRepository.delete(room);
    }

    private Room findRoomOrThrow(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    private RoomResponse toResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .type(room.getType().name())
                .pricePerNight(room.getPricePerNight())
                .status(room.getStatus().name())
                .title(room.getTitle())
                .description(room.getDescription())
                .amenities(room.getAmenities())
                .rating(room.getRating())
                .imageUrl(room.getImageUrl())
                .build();
    }
}
