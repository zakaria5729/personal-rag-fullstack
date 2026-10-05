package com.zakaria5729.app;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PersonalRagApplication {

    public static final Logger appLogger = LogManager.getLogger();

    public static void main(String[] args) {
        SpringApplication.run(PersonalRagApplication.class, args);
    }
}
