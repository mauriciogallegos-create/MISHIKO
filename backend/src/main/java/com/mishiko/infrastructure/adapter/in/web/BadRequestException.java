package com.mishiko.infrastructure.adapter.in.web;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
