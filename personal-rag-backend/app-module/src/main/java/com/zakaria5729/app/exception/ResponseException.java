package com.zakaria5729.app.exception;

import org.springframework.http.HttpStatus;

public class ResponseException extends RuntimeException {
    private final HttpStatus httpStatus;
    private final Object payload;

    public ResponseException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.payload = null;
    }

    public ResponseException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
        this.payload = null;
    }

    public ResponseException(String message, HttpStatus httpStatus, Object payload) {
        super(message);
        this.httpStatus = httpStatus;
        this.payload = payload;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public Object getPayload() {
        return payload;
    }
}
