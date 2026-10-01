package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.UserRequest;
import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.dto.UserUpdateRequest;
import com.workintech.twitter_api.entity.Role;
import com.workintech.twitter_api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable Long id, Authentication authentication) {
        return withOwnEmail(userService.findById(id), authentication);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request, Authentication authentication) {
        var currentUser = userService.findEntityByUsername(authentication.getName());

        // Sadece kendi bilgilerini güncelleyebilir veya ADMIN herkesi güncelleyebilir
        if (!currentUser.getId().equals(id) && !currentUser.getRole().equals(Role.ADMIN)) {
            throw new AccessDeniedException("You can only update your own profile");
        }

        UserResponse response = userService.updateUser(id, request);
        if (currentUser.getId().equals(id)) {
            response.setEmail(userService.findEntityById(id).getEmail());
        }
        return response;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id, Authentication authentication) {
        var currentUser = userService.findEntityByUsername(authentication.getName());

        // Sadece kendi hesabını silebilir veya ADMIN herkesi silebilir
        if (!currentUser.getId().equals(id) && !currentUser.getRole().equals(Role.ADMIN)) {
            throw new AccessDeniedException("You can only delete your own account");
        }

        userService.deleteUser(id);
    }

    @GetMapping("/username/{username}")
    public UserResponse findByUsername(@PathVariable String username, Authentication authentication) {
        return withOwnEmail(userService.findByUsername(username), authentication);
    }

    @GetMapping("/email/{email}")
    public UserResponse findByEmail(@PathVariable String email, Authentication authentication) {
        var currentUser = userService.findEntityByUsername(authentication.getName());
        // Başkasının e-postasını sorgulayarak hesap kimliğini öğrenmeyi de engelle.
        if (!email.equals(currentUser.getEmail())) {
            throw new AccessDeniedException("You can only look up your own email");
        }
        return withOwnEmail(userService.findById(currentUser.getId()), authentication);
    }

    @GetMapping("/search")
    public List<UserResponse> searchUsers(@RequestParam String keyword) {
        return userService.searchUsers(keyword);
    }

    private UserResponse withOwnEmail(UserResponse response, Authentication authentication) {
        var currentUser = userService.findEntityByUsername(authentication.getName());
        if (currentUser.getId().equals(response.getId())) {
            response.setEmail(currentUser.getEmail());
        }
        return response;
    }
}
