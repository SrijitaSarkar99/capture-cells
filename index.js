const http = require('http');
const WebSocketServer = require('websocket').server;
const { v4:uuidv4 } = require('uuid');

//To serve this page on another port using express
const app = require('express')();
app.get("/", (req, res) => res.sendFile(__dirname + "/client/index.html"));

app.listen(9091, () => console.log("Listening on http port 9091"))



const httpServer = http.createServer();
// Websocket will overwrite any function we give to http here
httpServer.listen(9090, () => console.log("Listening on 9090.."));
//An http server is established creating a TCP connection.
//We pass this to our websocket logic


//hashmap for clients
const clients = {};
const games = {};

//Creating a websocket server
const wsServer = new WebSocketServer({
    "httpServer": httpServer
});

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);   //accepting the connection
    connection.on("open", () => console.log("Connection is open.."));
    connection.on("close", () => console.log("Connection is closed"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);
        //Recieved a message from the client
        //console.log(result);
        //user wants to create a new game
        if(result.method == "create") {
           const clientId = result.clientId;
           const gameId = uuidv4();
           games[gameId] = {
               "id": gameId,
               "cells": 40
           };

           const payLoad = {
               "method": "create",
               "game": games[gameId]
           };

           const con = clients[clientId].connection;
           con.send(JSON.stringify(payLoad));
        };
    });

    //generate a new clientID
    const clientID = uuidv4();
    clients[clientID] = {
        "connection": connection
    };

    // to send back client connect
    const payLoad = {
        "method": "connect",
        "clientId": clientID 
    };

    connection.send(JSON.stringify(payLoad));
    
});
