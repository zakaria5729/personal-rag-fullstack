package com.zakaria5729.app.exception;

import com.zakaria5729.app.model.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import static com.zakaria5729.app.PersonalRagApplication.appLogger;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ApiResponse> handleAlreadyExists(AlreadyExistsException ex) {
        var error = new ApiResponse(ex.getMessage(), null);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse> handleNotFound(NotFoundException ex) {
        var error = new ApiResponse("No content found with this id", null);
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ResponseException.class)
    public ResponseEntity<ApiResponse> handleResponseException(ResponseException e, HttpServletRequest request) {
        appLogger.error("Response Exception", e);
        var response = new ApiResponse(e.getMessage(), e.getPayload());
        var status = e.getHttpStatus() != null ? e.getHttpStatus() : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(AppDataAccessException.class)
    public ResponseEntity<ApiResponse> handleDataAccess(AppDataAccessException ex) {
        appLogger.error("Data Exception", ex);
        var error = new ApiResponse("Something went wrong", null);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneralException(Exception ex) {
        appLogger.error("Unexpected Exception", ex);
        var error = new ApiResponse("An internal error occurred", null);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Override
    protected @Nullable ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream().map(f -> f.getField() + ": " + f.getDefaultMessage()).toList();
        String errorMessage = String.join(", ", errors);
        return new ResponseEntity<>(new ApiResponse(errorMessage, null), HttpStatus.BAD_REQUEST);
    }
}
