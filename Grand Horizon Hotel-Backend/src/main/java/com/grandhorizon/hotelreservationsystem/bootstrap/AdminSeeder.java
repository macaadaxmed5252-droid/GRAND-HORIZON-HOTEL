package com.grandhorizon.hotelreservationsystem.bootstrap;

import com.grandhorizon.hotelreservationsystem.entity.Role;
import com.grandhorizon.hotelreservationsystem.entity.User;
import com.grandhorizon.hotelreservationsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Guarantees the application never boots into a state with zero
 * administrator accounts. Runs once the application context is fully up
 * (including the embedded web server), counts existing {@code ROLE_ADMIN}
 * users, and - only if none exist - seeds a single default admin with a
 * BCrypt-hashed password sourced from configuration.
 * <p>
 * This is the recovery path for the lockout scenario {@code UserServiceImpl}
 * already prevents proactively: deleting the last admin while the app is
 * running is blocked outright, so the only way this seeder ever fires is on
 * a genuinely fresh database.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${application.security.default-admin.name}")
    private String defaultAdminName;

    @Value("${application.security.default-admin.email}")
    private String defaultAdminEmail;

    @Value("${application.security.default-admin.password}")
    private String defaultAdminPassword;

    @Value("${application.security.default-admin.phone}")
    private String defaultAdminPhone;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultAdminIfMissing() {
        long adminCount = userRepository.countByRole(Role.ROLE_ADMIN);
        if (adminCount > 0) {
            log.info("Startup admin check passed - {} administrator account(s) already present", adminCount);
            return;
        }

        String normalizedEmail = defaultAdminEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("No ROLE_ADMIN account exists, but the default admin email [{}] is already registered to a " +
                    "non-admin account. Skipping automatic seeding - promote an existing user to ROLE_ADMIN manually.",
                    normalizedEmail);
            return;
        }

        User admin = User.builder()
                .name(defaultAdminName)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(defaultAdminPassword))
                .phone(defaultAdminPhone)
                .role(Role.ROLE_ADMIN)
                .build();

        userRepository.save(admin);

        log.warn("No administrator account was found on startup - seeded a default admin [{}]. " +
                "Log in and change this password immediately; it is stored in application.properties in plaintext.",
                normalizedEmail);
    }
}
