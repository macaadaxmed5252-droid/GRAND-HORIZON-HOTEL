package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.exception.FileStorageException;
import com.grandhorizon.hotelreservationsystem.exception.InvalidFileException;
import com.grandhorizon.hotelreservationsystem.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Saves uploaded images (room photos, admin avatars) to local subdirectories
 * on the server's filesystem and returns the public URL path under which
 * {@link com.grandhorizon.hotelreservationsystem.config.WebConfig} serves
 * them back. Room and avatar uploads share identical validation/storage
 * mechanics, parameterized by subdirectory.
 */
@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${application.upload.root-dir:uploads}")
    private String uploadRootDir;

    @Value("${application.upload.rooms-subdir:rooms}")
    private String roomsSubdir;

    @Value("${application.upload.avatars-subdir:avatars}")
    private String avatarsSubdir;

    @Override
    public String storeRoomImage(MultipartFile file) {
        return storeImage(file, roomsSubdir);
    }

    @Override
    public void deleteRoomImage(String imageUrl) {
        deleteImage(imageUrl, roomsSubdir);
    }

    @Override
    public String storeAvatarImage(MultipartFile file) {
        return storeImage(file, avatarsSubdir);
    }

    @Override
    public void deleteAvatarImage(String imageUrl) {
        deleteImage(imageUrl, avatarsSubdir);
    }

    private String storeImage(MultipartFile file, String subdir) {
        validateFile(file);

        Path directory = resolveDirectory(subdir);
        String uniqueFilename = buildUniqueFilename(file.getOriginalFilename());
        Path targetPath = directory.resolve(uniqueFilename).normalize();

        try {
            Files.createDirectories(directory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new FileStorageException("Failed to store uploaded image file: " + uniqueFilename, ex);
        }

        log.info("Stored image [{}/{}] ({} bytes)", subdir, uniqueFilename, file.getSize());
        return "/" + uploadRootDir + "/" + subdir + "/" + uniqueFilename;
    }

    private void deleteImage(String imageUrl, String subdir) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        String filename = Paths.get(imageUrl).getFileName().toString();
        Path targetPath = resolveDirectory(subdir).resolve(filename).normalize();

        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException ex) {
            log.warn("Could not delete stale image [{}/{}]: {}", subdir, filename, ex.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("The uploaded image file must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidFileException(
                    "Unsupported file type: " + contentType + ". Allowed types are JPEG, PNG, WEBP, and GIF");
        }
    }

    private String buildUniqueFilename(String originalFilename) {
        // Strip any client-supplied path segments (e.g. "../../etc/passwd")
        // so the stored name can never escape the target directory.
        String sanitizedName = StringUtils.hasText(originalFilename)
                ? Paths.get(originalFilename).getFileName().toString()
                : "upload";
        return UUID.randomUUID() + "_" + sanitizedName;
    }

    private Path resolveDirectory(String subdir) {
        return Paths.get(uploadRootDir, subdir).toAbsolutePath().normalize();
    }
}
