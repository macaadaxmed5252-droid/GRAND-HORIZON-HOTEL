package com.grandhorizon.hotelreservationsystem.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Exposes the local {@code uploads/} directory over HTTP so files saved by
 * {@link com.grandhorizon.hotelreservationsystem.service.FileStorageService}
 * are reachable at {@code http://localhost:5252/uploads/...}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${application.upload.root-dir:uploads}")
    private String uploadRootDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Deliberately NOT using Path#toUri() here: on a project path containing
        // spaces (e.g. ".../spring Boot/.../Grand Horizon Hotel-Backend/uploads"),
        // toUri() percent-encodes them ("spring%20Boot"), and that encoded string
        // then gets treated as a literal filesystem path by the resource loader -
        // which doesn't exist on disk, so EVERY request under /uploads/** fails
        // with a 500 (not a 404) because the resource location itself can't be
        // resolved, regardless of whether the requested file exists. Building the
        // "file:" location from the raw absolute path string sidesteps this
        // entirely.
        String uploadPath = Paths.get(uploadRootDir)
                .toAbsolutePath()
                .normalize()
                .toString()
                .replace('\\', '/');

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
