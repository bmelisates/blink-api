package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.LoginRequest;
import com.workintech.twitter_api.dto.LoginResponse;

// Authentication(Kimlik doğrulama) işlemlerinin Service katmanındaki sözleşmesi.
public interface AuthService {
    // Kullanıcının giriş yapmasını sağlar ve başarılı girişte JWT token döndürür.
    LoginResponse login(LoginRequest request);
}
