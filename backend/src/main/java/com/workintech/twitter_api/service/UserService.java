package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.UserRequest;
import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.dto.UserUpdateRequest;
import com.workintech.twitter_api.entity.User;

import java.util.List;

public interface UserService {
    // --- Temel CRUD İşlemleri ---
    UserResponse findById(Long id);

    List<UserResponse> findAll();

    UserResponse createUser(UserRequest request);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void deleteUser(Long id);

    // --- Arama ve Sorgulama Metotları ---
    UserResponse findByUsername(String username);

    UserResponse findByEmail(String email);

    List<UserResponse> searchUsers(String keyword);

    // --- Doğrulama Kontrolleri ---
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // --- Entity Dönen Metotlar (Diğer Servislerin İç Kullanımı İçin) ---
    User findEntityById(Long id);

    User findEntityByUsername(String username);
}
