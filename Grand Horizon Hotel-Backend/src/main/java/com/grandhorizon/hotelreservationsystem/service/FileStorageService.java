package com.grandhorizon.hotelreservationsystem.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * Persists an uploaded room image to local disk under a unique,
     * collision-proof filename and returns the public, relative URL path
     * (e.g. {@code /uploads/rooms/<uuid>_<original-name>.jpg}) to store
     * against the {@code Room} record.
     */
    String storeRoomImage(MultipartFile file);

    /**
     * Best-effort deletion of a previously stored room image, identified by
     * the URL path returned from {@link #storeRoomImage}. Failures are
     * logged rather than propagated, since a stale file left on disk should
     * never block the database update that triggered the deletion.
     */
    void deleteRoomImage(String imageUrl);

    /**
     * Same contract as {@link #storeRoomImage}, but for an admin's profile
     * picture (e.g. {@code /uploads/avatars/<uuid>_<original-name>.jpg}).
     */
    String storeAvatarImage(MultipartFile file);

    /** Same contract as {@link #deleteRoomImage}, for avatar images. */
    void deleteAvatarImage(String imageUrl);
}
