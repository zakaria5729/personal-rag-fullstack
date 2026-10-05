package com.zakaria5729.app.exception;

import org.springframework.dao.DataAccessException;

public class AppDataAccessException extends DataAccessException {
    public AppDataAccessException(String msg) {
        super(msg);
    }

    public AppDataAccessException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
