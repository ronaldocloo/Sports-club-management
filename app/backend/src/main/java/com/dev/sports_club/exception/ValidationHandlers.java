package com.dev.sports_club.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns malformed input and unexpected failures into clean JSON. Nothing about the server's internals
 * (class names, SQL, stack traces) is ever sent to the client.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class ValidationHandlers {

    private static final Logger log = LoggerFactory.getLogger(ValidationHandlers.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));
        Map<String, Object> body = body(HttpStatus.BAD_REQUEST, "Some fields are missing or invalid");
        body.put("errors", fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> malformed(Exception ex) {
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "The request could not be understood"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> denied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body(HttpStatus.FORBIDDEN, "You do not have permission to do that"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> illegalState(IllegalStateException ex) {
        // Raised, for example, when a write is attempted with no organization selected.
        if (ex.getMessage() != null && ex.getMessage().startsWith("No organization selected")) {
            return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "Select an organization first"));
        }
        return unexpected(ex);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> unexpected(Exception ex) {
        // Framework errors that already carry a status (404, 405, 415 ...) keep it.
        if (ex instanceof org.springframework.web.ErrorResponse er) {
            HttpStatus status = HttpStatus.resolve(er.getStatusCode().value());
            return ResponseEntity.status(er.getStatusCode()).body(body(status != null ? status : HttpStatus.BAD_REQUEST, status != null ? status.getReasonPhrase() : "Error"));
        }
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on our side. Please try again"));
    }

    private static Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
