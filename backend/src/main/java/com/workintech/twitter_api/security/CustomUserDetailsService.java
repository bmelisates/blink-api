package com.workintech.twitter_api.security;

import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// UserDetailsService:
// Spring Security'nin kullanıcıyı nasıl bulacağını belirleyen interface'tir.
// Spring Security bize username verir. Biz de bu username ile veritabanından User'ı buluruz.
@Service
public class CustomUserDetailsService implements UserDetailsService {

    // Kullanıcıyı veritabanından bulmak için UserRepository'yi kullanıyoruz.
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public CustomUserDetails loadUserById(Long id) {
        return new CustomUserDetails(userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found")));
    }

    // Spring Security kullanıcıyı bulmak istediğinde bu metodu çağırır.
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // Repository üzerinden username ile DB'de kullanıcıyı arıyoruz.
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        //UsernameNotFoundException -> Spring Security'nin hazır exception sınıfı
                        new UsernameNotFoundException("User not found"));

        // DB'den bulduğumuz User entity'sini CustomUserDetails içine koyuyoruz.
        // CustomUserDetails, User entity'mizi Spring Security'nin anlayacağı UserDetails formatına uyarlar.
        return new CustomUserDetails(user);
    }
}
