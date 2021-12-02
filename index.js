const http = require('http');
const WebSocketServer = require('websocket').server;
const { v4:uuidv4 } = require('uuid');

//To serve this page on another port using express
const app = require('express')();
app.get("/", (req, res) => res.sendFile(__dirname + "/client/index.html"));
app.get("/", (req, res) => res.sendFile(__dirname + "/client/styles.css"));


app.listen(9091, () => console.log("Listening on http port 9091"))



const httpServer = http.createServer();
// Websocket will overwrite any function we give to http here
httpServer.listen(9090, () => console.log("Listening on 9090.."));
//An http server is established creating a TCP connection.
//We pass this to our websocket logic


//hashmap for clients
const clients = {};
let games = {};

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
        console.log(result.method);
        //Recieved a message from the client
        //console.log(result);

        //user wants to create a new game
        if(result.method == "create") {
           const clientId = result.clientId;
           const gameId = uuidv4();
           games[gameId] = {
               "id": gameId,
               "cells": 40,
               "clients": []
           };

           const payLoad = {
               "method": "create",
               "game": games[gameId]
           };

           const con = clients[clientId].connection;
           con.send(JSON.stringify(payLoad));
        }


        // a client wants to join
        if(result.method == "join") {

            const clientId = result.clientId;
            console.log(clientId);
            const gameId = result.gameId;
            const game = games[gameId];
            //console.log("here");
            if(game.clients.length >= 3) {
                //max player reached
                console.log("Room is full");
                return;
            }

            const color = {
                "0": "Red",
                "1": "Blue",
                "2": "Green"
            }[game.clients.length];

            game.clients.push({
                "clientId": clientId,
                "color": color
            })

            if(game.clients.length === 3) updateGameState();

            const payLoad = {
                "method": "join",
                "game": game
            }

            //loop through all clients and tell them people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            })
        }

        //a user plays
        if (result.method === "play"){
            
            const gameId = result.gameId;
            const cellId = result.cellId;
            const color = result.color
            let state = games[gameId].state;
            if(!state) 
                state = {};

            state[cellId] = color;
            games[gameId] = state;
            const game = games[gameId];

            const payLoad = {
                "method": "play",
                "game": game
            }
        }


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

    console.log(payLoad);

    connection.send(JSON.stringify(payLoad));
    
});


//To update game state for all clients
function updateGameState(){
    console.log(games)

    for (const g of Object.keys(games)) {
        const game = games[g];
        console.log("here")
        console.log(game);
        console.log(game.clients);
        const payLoad = {
            "method": "update",
            "game": game
        };

        game.clients.forEach(c=> {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    setTimeout(updateGameState, 500);
}
