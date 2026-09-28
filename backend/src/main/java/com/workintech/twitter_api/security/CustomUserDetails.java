package com.workintech.twitter_api.security;

import com.workintech.twitter_api.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

//CustomUserDetails -> User Entitysi ile Spring Security arasında adaptör.
// UserDetails interface'ini implement ederek Spring Security'ye kullanıcının username, password ve role bilgilerini sağlıyoruz.
// Böylece veritabanındaki kullanıcıyı Spring Security'nin anlayacağı kullanıcı formatına dönüştürüyoruz."


// UserDetails (interface):
// Spring Security'nin kullanıcıdan beklediği bilgilerin tanımıdır.
// Spring Security "Ben kullanıcıyı bu formatta tanımak istiyorum." diyor.
public class CustomUserDetails implements UserDetails {

    // Bizim gerçek kullanıcı nesnemiz. Yani DB'den gelen User burada tutuluyor.
    private final User user;

    // CustomUserDetails oluştururken User vermemiz gerekiyor. Örn:
    // User user = userRepository.findByUsername(...);
    // new CustomUserDetails(user);
    public CustomUserDetails(User user) {
        this.user = user;
    }

    public Long getId() { return user.getId(); }

    public long getTokenVersion() { return user.getTokenVersion(); }


    // Spring Security kullanıcının USERNAME'ini sorduğunda bizim User entity'mizdeki username'i döndürüyoruz.
    @Override
    public String getUsername() {
        return user.getUsername();
    }


    // Spring Security kullanıcının PASSWORD'ünü sorduğunda bizim User entity'mizdeki password'ü döndürüyoruz.
    @Override
    public String getPassword() {
        return user.getPassword();
    }


    // Kullanıcının yetkilerini/rollerini döndürür. (ROLE_USER, ROLE_ADMIN gibi)
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }


    // Kullanıcının hesabının süresi dolmuş mu?
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }


    // Kullanıcının hesabı kilitli mi?
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }


    // Kullanıcının şifresinin süresi dolmuş mu?
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }


    // Kullanıcı aktif mi?
    @Override
    public boolean isEnabled() {
        return true;
    }
}
