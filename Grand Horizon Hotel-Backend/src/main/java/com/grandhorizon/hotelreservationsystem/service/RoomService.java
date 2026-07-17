package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.request.RoomRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.RoomResponse;
import com.grandhorizon.hotelreservationsystem.entity.RoomStatus;
import com.grandhorizon.hotelreservationsystem.entity.RoomType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RoomService {

    List<RoomResponse> getAllRooms(RoomType type, RoomStatus status);

    RoomResponse getRoomById(Long id);

    RoomResponse createRoom(RoomRequest request, MultipartFile image);

    RoomResponse updateRoom(Long id, RoomRequest request, MultipartFile image);

    void deleteRoom(Long id);
}
