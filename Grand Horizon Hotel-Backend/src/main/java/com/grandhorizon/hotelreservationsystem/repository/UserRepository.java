package com.grandhorizon.hotelreservationsystem.repository;

import com.grandhorizon.hotelreservationsystem.entity.Role;
import com.grandhorizon.hotelreservationsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    long countByRoleAndIsDeletedFalse(Role role);

    // Listing queries filter isDeleted explicitly here rather than via a
    // class-level @Where on User (see the entity's javadoc for why) - a
    // soft-deleted guest simply stops appearing in the admin guest list,
    // without affecting a historical Booking's user association resolving.
    Page<User> findByIsDeletedFalse(Pageable pageable);

    /** Case-insensitive match on name OR email among active (non-deleted) guests, for the admin guest search box. */
    @Query("""
            SELECT u FROM User u
            WHERE u.isDeleted = false
              AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<User> searchActiveByNameOrEmail(@Param("search") String search, Pageable pageable);
}
