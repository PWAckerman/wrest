const WebSocket = require('ws');


class SocketServer{
    constructor(port, routes={}, auth, secure=false){
        if(!auth){
            auth = () => true;
        }
        let self = this;
        if(secure){
            //only import these if necessary
            const fs = require('fs');
            const privateKey  = fs.readFileSync(secure.keyPath, 'utf8');
            const certificate = fs.readFileSync(secure.certPath, 'utf8');
            const credentials = {key: privateKey, cert: certificate};
            const express = require('express');
            const app = express();
            const https = require('https');
            var httpsServer = https.createServer(credentials, app);
            this.wss = new WebSocket.Server({
                server: httpsServer
            });
        } else if(!secure){
            this.wss = new WebSocket.Server({
                port: port,
                verifyClient: (info)=>{
                    let authentication = info.req.headers['sec-websocket-protocol'];
                    let [url, query] = info.req.url.split('?');
                    let splitUrl = url.split('/');
                    if(splitUrl[splitUrl.length - 1] !== splitUrl[1]){
                        entityId = parseIfInt(splitUrl[splitUrl.length - 1]);
                        url = '/' + splitUrl[1];
                    };
                    return self.routes[url].auth ? auth(authentication, info) : true;
                }
            })
        }
        this.routes = routes;
        this.wss.on('connection', function connection(ws) {
          let queries;
          let entityId;
          let [url, query] = ws.upgradeReq.url.split('?');
          let splitUrl = url.split('/');
          if(splitUrl[splitUrl.length - 1] !== splitUrl[1]){
              entityId = parseIfInt(splitUrl[splitUrl.length - 1]);
              url = '/' + splitUrl[1];
          };
          if(query){
              queries = query.split('&').reduce(
                  (acc, queryTuple) => {
                      queryTuple = queryTuple.split('=');
                      acc[queryTuple[0]] = queryTuple[1];
                      return acc;
                  }, {})
          }
          console.log('connected');
          console.log(url)
          Object.keys(self.routes).includes(url) ? self.routes[url].registerSocket(ws, queries, entityId) : ws.close();
        });
    }
}

function parseIfInt(val){
    return isNaN(parseInt(val)) ? val : parseInt(val)
}

module.exports = SocketServer
