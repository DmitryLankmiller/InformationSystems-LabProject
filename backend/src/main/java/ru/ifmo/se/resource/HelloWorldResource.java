package ru.ifmo.se.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("hello")
public class HelloWorldResource {

    @GET
    public String helloWorld() {
        return "Hello, world!";
    }
}
