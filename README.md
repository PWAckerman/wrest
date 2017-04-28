[![npm version](https://badge.fury.io/js/wrest.svg)](https://badge.fury.io/js/wrest)
# wREST
RESTlike semantics over WebSockets (wREST)
(a work in progress)

## What It Is
A Node.js server framework that listens for changes in your PostgreSQL database and emits them via WebSockets (kind of like FireBase, but BYO fire/base). `POST`, `PATCH`,`DELETE` methods (transmitted via JSON) allow you to interact cleanly with your DB in a REST-like manner, and your initial subscription (`GET`) can use traditional query parameter styles to filter what updates you receive.

## Prerequisites
* A relatively recent version of PostgreSQL. `LISTEN` and `NOTIFY` commands, which this project depends on, go back at least as far as 7.1.
* A running instance of PostgreSQL with an established cluster listening on port `5432`, and its username, password, hostname, and database name.

## How It Works
Broad Strokes:
1. Create [Sequelize](http://docs.sequelizejs.com/en/v3/) models for each entity (table) in your DB
2. Create wREST Entity object wrappers for each model
3. Initiate your wREST server with your configuration (PostgreSQL connection details) and a collection of entities
4. You can now subscribe to your endpoints (`GET`) as determined by your Entity names

## Tutorial
### Building the Server
* Make an object with Sequelize attributes
```
const userModel = {
        username: {
	        type: Sequelize.STRING,
	        allowNull: false
        },
        birthday: {
	        type: Sequelize.DATE,
	        allowNull: false
	    }
}
```

Don't pass it to `sequelize.define()`. wREST will handle that step for you.

* Pass this object to the wREST entity wrapper constructor
```
const Entity = require('wrest').Entity;
const user = new Entity('user', userModel);
```
* Make a collection of your entities
```
const entities = [userModel];
```

* Make a configuration object
```
const config = {
    port: process.env.PORT, //port you're communicating over
    dbUser: process.env.DBUSER, //username for Postgres
    dbPassword: process.env.DBPASSWORD, //password for Postgres
    dbHost: process.env.DBHOST, //name of network host serving Postgres (can be local)
    dbName: process.env.DBNAME, //name of your database within Postgres
}
```
In return, you will receive an object:
* Pass your entity collection and configuration object to the wREST server constructor
```
const WrestServer = require('wrest').WrestServer;
const server = new WrestServer(config, entities);
```

Your server is now running, and supports all WebSocket endpoints as defined by your entity names.

## Subscribing to Endpoints
To be consistent with our previous examples:
* Start by creating a new WebSocket in your client
```
\\using ES5 conventions for browser console
var socket = new WebSocket('ws://localhost:9000/user');
```
You are now subscribed to the endpoint.

* Setup your listener
```
socket.addEventListener('message', function (event) {
    console.log('socket');
    var data = JSON.parse(event.data);
});
```
Now you will receive new data whenever some sort of transaction occurs on that table (`INSERT`, `DELETION`, `UPDATE`) initiated by any client (we will explain filtering relevant transactions shortly)
* Make a `GET` request since you probably want some initial dataset as opposed to just receiving updates
```
socket.send(JSON.stringify({method: 'GET'}))
```
In return, you will receive _this_ object as `event.data`:
```
{SELECT: [Object, Object, Object]}
```
The key reflects the SQL command that resulted in this data being emitted over the socket (in this case a `SELECT` command). The value is always an array of results (even if there is only one result). In our example, we did a general subscription to the endpoint, so we received an array of all users. In constrast, if we had `POST`ed to this endpoint, only the new user would have been emitted:

```socket.send(
    JSON.stringify({
        "method": "POST",
        "body": {
            "username":"boaty",
            "birthday":"Thu Apr 27 2017 15:44:28 GMT-0400 (EDT)"
        }
}))

\\{INSERT: [newObj]}
```
...but this `newObj` would be emitted to any client that has subscribed to the User endpoint. How do we limit what we receive from the endpoint?

* When we subscribe to the endpoint, we can use a path parameter or query parameters to filter the results we receive.

```
\\This will subscribe to users with primary key of 5
var user5Socket = new WebSocket('ws://localhost:9000/user/5');

\\This will subscribe to users with username of 'boaty'
var boatySocket = new WebSocket('ws://localhost:9000/user?username=boaty');
```
For either of these sockets, we will only receive updates if rows that match these criteria are inserted, updated, or deleted.

##Authentication
There are two components to authentication:

* An authentication callback
* Setting authentication on an Entity

The authentication callback is function that gets called during the WebSocket handshake. It get passed two arguments: `authentication` and `info`.
`authentication` is an object derived from the `sec-websocket-protocol` optional headers that can be sent with the original websocket handshake like this:
```
var socket = new WebSocket('ws://localhost:9000/user', ["Authorization","xtoken"]);
```
This becomes a string in the callback:
`'Authorization, xtoken'`
that you can then check against something (you determine your own method of authentication & authorization).

The `info` object is a rather complex object that has a great deal of information about the handshake request. You should be able to access cookies off of this object if necessary.

The callback should return `true` if authorized, `false` if not. This auth callback is only performed during the initial subscription (once the client is authenticated, they are authorized) but is called for every new socket subscription.

In order to register this authentication callback, it is passed to the `WrestServer` constructor as part of the config object:
```
const config = {
    port: process.env.PORT, //port you're communicating over
    dbUser: process.env.DBUSER, //username for Postgres
    dbPassword: process.env.DBPASSWORD, //password for Postgres
    dbHost: process.env.DBHOST, //name of network host serving Postgres (can be local)
    dbName: process.env.DBNAME, //name of your database within Postgres
        auth: (authentication, info)=>{
        console.log(authentication.split(','));
        return authentication.split(',')[1] === ' token'
    }
}
```

In addition, we must declare which entities (endpoints) should require authentication. That is accomplished by passing `true` as the third parameter to the `Entity` constructor.
```
const server = new WrestServer(config, entities, true);
```
Authentication is _not_ enabled by default.

Currently you will need to setup your own means of obtaining an authorization token or cookie, though that doesn't mean you couldn't necessarily do it over an unprotected Entity endpoint.

## Encryption
A method to use `WSS` instead of `WS` is currently being worked on. Currently experimenting with self-signed certificates.

## Todos
* Work on Encryption
* Optimize broadcasting algorithm (use a hash table for mapping queries to sockets, rather than naive filter?)
* Clean up code (SOLID)
* Tests
* Document API with jsDoc/ReadTheDocs
* Client side data structure library
