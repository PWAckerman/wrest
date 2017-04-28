'use strict'; 

class Route{
    constructor(methods, queries, entity, auth, sockets=[]){
        this.methods = methods;
        this.queries = queries;
        this.entity = entity;
        this.sockets = sockets;
        this.auth = auth;
    }

    registerSocket(socket, queries, entityId=false){
        let self = this;
        let primaryKey = self.entity.primaryKeyAttributes[0];
        if(entityId){
            queries ? '' : queries = {};
            queries[primaryKey] = entityId;
        }
        socket.queries = queries || {};
        this.sockets.push(socket);
        socket.on('message', function incoming(message) {
          message = JSON.parse(message);
          try {
             self[message.method](socket, message.body || {}, self.entity, message.queries || '');
              }
          catch(e){
                 socket.send(JSON.stringify({error: e}))
             }
        });
        socket.on('close', (code, reason)=>{
            socket.terminate();
            let inx = self.sockets.indexOf(socket);
            delete self.sockets[inx];
        })
    }

    setHandler(method, handler){
        this[method] = handler;
    }

    broadcastToSockets(msg){

    }
}

module.exports = Route;
