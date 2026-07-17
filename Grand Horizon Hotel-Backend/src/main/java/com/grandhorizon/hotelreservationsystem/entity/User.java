package com.grandhorizon.hotelreservationsystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Represents a registered user of the hotel reservation system.
 * Implements {@link UserDetails} so it can be used directly by Spring
 * Security as the authenticated principal.
 * <p>
 * Soft-deletable: {@link #isDeleted} is flipped to {@code true} by
 * {@code @SQLDelete} instead of physically removing the row, so historical
 * bookings keep a valid, resolvable {@code user_id} and revenue/guest
 * reporting never has to drop or null out a deleted guest's past activity.
 * <p>
 * Deliberately NOT annotated with Hibernate's {@code @Where(clause =
 * "is_deleted = false")}: that filter applies to every load of this entity,
 * including when it's resolved as the "many" side of {@code Booking.user}
 * via lazy-loading - so a soft-deleted guest's own historical bookings would
 * silently fail to resolve their user association. Listing endpoints
 * (admin guest search) filter {@code isDeleted = false} explicitly at the
 * repository/query level instead, which only affects "show me active
 * guests" listings, never entity-to-entity navigation.
 */
@Entity
@Table(
        name = "users",
        indexes = @Index(name = "idx_users_email", columnList = "email")
)
@Data
@EqualsAndHashCode(of = "id")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE users SET is_deleted = true WHERE id = ?")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.ROLE_USER;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // columnDefinition carries an explicit SQL DEFAULT so ddl-auto=update's
    // ALTER TABLE ADD COLUMN backfills every existing row with `false`
    // instead of failing outright - Postgres rejects adding a NOT NULL
    // column with no default to a table that already has rows.
    /** Flipped by {@code @SQLDelete} above rather than set directly in application code. */
    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean isDeleted = false;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Spring Security's {@code DaoAuthenticationProvider} checks this after
     * successful password verification and rejects login with a
     * {@code DisabledException} if false - the standard hook for blocking a
     * soft-deleted account from authenticating without needing separate
     * filtering logic in the login path itself.
     */
    @Override
    public boolean isEnabled() {
        return !isDeleted;
    }
}
