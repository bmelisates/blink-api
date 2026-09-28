package com.workintech.twitter_api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity //JPA Entity -> Veritabanı tablosuyla ilişkilendirilmiş bir sınıf.
@Table(name = "users") //Veritabanı tablosu -> users
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id //Primary Key -> Bir tablodaki sütunun her satırını benzersiz olarak tanımlayan değer.
    @GeneratedValue(strategy = GenerationType.IDENTITY) //Auto Increment -> Otomatik olarak değer atanır.
    private Long id;

    @NotBlank(message = "Username must not be blank")
    @Size(min = 3, max = 45, message = "Username must be between 3 and 45 characters")
    @Column(nullable = false, unique = true, length = 45)
    private String username;

    @NotBlank(message = "Password must not be blank")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.USER; // Varsayılan olarak her kaydolan normal USER olur

    // Şifre değişikliğinde artırılır; önceki token'lar reddedilir.
    @Column(name = "token_version", nullable = false, columnDefinition = "bigint default 0")
    private long tokenVersion = 0;

    // User'ın tweetleri
    @OneToMany(mappedBy = "user", // Tweet.java sınıfının içindeki User user değişkenini işaret ediyoruz!!!!!
            cascade = CascadeType.ALL, // user silinirse ona ait tweetler de silinir
            orphanRemoval = true)
    // user'ın tweets kümesinden tweet çıkarılırsa(tweet sahipsiz kalırsa) o tweet datadan da silinir
    private Set<Tweet> tweets = new HashSet<>(); //Boş küme oluşturuyoruz. null dönüp exception fırlatmasın.

    // User'ın retweetleri
    @OneToMany(mappedBy = "user",
            cascade = CascadeType.ALL, //user silinirse ona ait retweetler de silinir
            orphanRemoval = true)
    // user'ın retweets kümesinden bir retweet kaldırılırsa o retweet veritabanından da silinir
    private Set<Retweet> retweets = new HashSet<>();

    // User'ın like'leri
    @OneToMany(mappedBy = "user",
            cascade = CascadeType.ALL, //user silinirse ona ait likelar da silinir
            orphanRemoval = true) // user'ın likes kümesinden bir like kaldırılırsa o like veritabanından da silinir
    private Set<Like> likes = new HashSet<>();
}
