package com.workintech.twitter_api.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    // Update için ayrı Request DTO kullandık.
    // Alanlar zorunlu olmadığı için @NotBlank kullanmıyoruz.
    // Gönderilmeyen alanlar güncellenmez.
    
    @Size(min = 3, max = 45, message = "Username must be between 3 and 45 characters")
    private String username;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;
}
