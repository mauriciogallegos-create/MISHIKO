package com.mishiko.infrastructure.adapter.in.web;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " no encontrado con id: " + id);
    }
}
