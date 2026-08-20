package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// JPA Repository -> Spring Data JPA'nın sağladığı bir arayüzdür
// temel CRUD (Create, Read, Update, Delete) işlemlerini gerçekleştirmek için kullanılır.
// SQL yazmaya gerek yok, sadece metot isimlerini belirtiyoruz.(metot isminden sorgu türetiyor!!)
// JpaRepository, belirli bir entity sınıfı ve onun primary key türü ile çalışır.
public interface UserRepository extends JpaRepository<User, Long> {

    // Belirli bir username'li kullanıcının bilgilerini getirir
    Optional<User> findByUsername(String username);
    // Optional -> değer bulunamadığında null yerine Optional.empty() döndürür.
    // Service katmanında orElseThrow() diyerek temizce Exception fırlatmamıza olanak sağlayacak.

    // Belirli bir email'li kullanıcının bilgilerini getirir
    Optional<User> findByEmail(String email);

    // Belirli bir arama kelimesine göre kullanıcının bilgilerini getirir(büyük küçük harf duyarsız)
    List<User> findByUsernameContainingIgnoreCase(String keyword);

    // Username ve Email mevcut mu kontrol eder
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
