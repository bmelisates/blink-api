package com.workintech.twitter_api.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message); // Mesajı üst sınıf olan RuntimeException'a gönderiyoruz
    }

}
