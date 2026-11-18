package com.mishiko.infrastructure.adapter.in.web;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
