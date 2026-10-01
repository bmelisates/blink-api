package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.UserRequest;
import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.dto.UserUpdateRequest;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // User entity'sini UserResponse'a çevirir. (Entity'yi direkt frontende göndermemek için)
    private UserResponse convertToResponse(User user) {
        UserResponse response = new UserResponse();

        response.setId(user.getId());
        response.setUsername(user.getUsername());
        // Genel profil, liste ve arama yanıtları özel hesap bilgisi içermez.

        return response;
    }

    // Id ile kullanıcıyı getir.(UserResponse)
    @Override
    public UserResponse findById(Long id) {
        // Id ile kullanıcı getir.
        User user = findEntityById(id);
        // UserResponse'a çevir.
        return convertToResponse(user);
    }

    // Tüm kullanıcıları getir.(UserResponse)
    @Override
    public List<UserResponse> findAll() {
        // Tüm kullanıcıları getir.
        return userRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Yeni kullanıcı oluştur.
    @Override
    public UserResponse createUser(UserRequest request) {

        // Username önceden alınmış mı kontrolü
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("Username already exists");
        }

        // Email önceden alınmış mı kontrolü
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email already exists");
        }

        // Requestten bilgileri alıp User'ı oluştur.
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Kaydet.
        User savedUser = userRepository.save(user);
        // UserResponse'a çevir. (Frontend için)
        return convertToResponse(savedUser);
    }

    // Mevcut kullanıcı bilgilerini güncelle.
    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        // Değiştirilmek istenen user mevcut mu?
        User existingUser = userRepository.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Username gönderilmişse kontrol et ve güncelle
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            Optional<User> userByUsername =
                    userRepository.findByUsername(request.getUsername());

            if (userByUsername.isPresent()
                    && !userByUsername.get().getId().equals(id)) {
                throw new ResourceAlreadyExistsException("Username already exists");
            }

            existingUser.setUsername(request.getUsername());
        }

        // Email gönderilmişse kontrol et ve güncelle
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            Optional<User> userByEmail =
                    userRepository.findByEmail(request.getEmail());

            if (userByEmail.isPresent()
                    && !userByEmail.get().getId().equals(id)) {
                throw new ResourceAlreadyExistsException("Email already exists");
            }

            existingUser.setEmail(request.getEmail());
        }

        // Password gönderilmişse encode edip güncelle
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            existingUser.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );
            existingUser.setTokenVersion(existingUser.getTokenVersion() + 1);
        }

        return convertToResponse(userRepository.save(existingUser));
    }

    // Mevcut kullanıcı bilgilerini sil.
    @Override
    public void deleteUser(Long id) {
        // Silinecek user mevcut mu?
        User existingUser = findEntityById(id);
        userRepository.delete(existingUser);
    }

    // Username ile kullanıcı getir.
    @Override
    public UserResponse findByUsername(String username) {
        // Username ile kullanıcı getir.
        User user = findEntityByUsername(username);
        return convertToResponse(user);
    }

    // Email ile kullanıcı getir.
    @Override
    public UserResponse findByEmail(String email) {
        // Email ile kullanıcı getir.
        return convertToResponse(userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }


    // Keyword ile kullanıcıları ara.
    @Override
    public List<UserResponse> searchUsers(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCase(keyword)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Username mevcut mu?
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    // Email mevcut mu?
    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Id ile kullanıcı getir.(Entity)
    @Override
    public User findEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));
    }

    // Username ile kullanıcı getir.(Entity)
    @Override
    public User findEntityByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
    }
}
