'use strict';
const pg = require('pg');
const q = require('q');
const Sequelizer = require('./sql/sequelize.js').Sequelizer;
const models = require('./sql/sequelize.js').models;
const functions = require('./sql/functions.js');

const SocketServer = require('./socket-server/socket-server.js');

//Example Config
// let config = {
//     dbUser: 'wrest_web',
//     dbPassword: 'dev',
//     dbHost: 'wrest_postgres',
//     dbName: 'wrest_api',
//     auth: (authentication, info)=>{
//         console.log(authentication.split(','));
//         return authentication.split(',')[1] === ' token'
//     }
//     // secure: {
//     //     keyPath: './wrest_network.key',
//     //     certPath: './wrest_network.cert'
//     // }
// }

class WrestServer{

    constructor(config, entities){
        console.log('constructin!', config, entities);
        this.config = config;
        this.pgStringTemplate = `postgres://${config.dbUser}:${config.dbPassword}@${config.dbHost}:5432/${config.dbName}`
        this.entities = entities;
    }

    listen(port, callback=()=>{}){
        let self = this;
        console.log('listenin')
        pg.connect(this.pgStringTemplate, (err, client)=>{
          if(err) {
            console.log(err);
          }

          let triggerPromises = Object.keys(functions).map((key)=> self._createTrigger(functions[key], client));

          Promise.all(triggerPromises)
              .then((allResults)=>{
                  console.log('sequelizin');
                  self.sequelizer = new Sequelizer(self.config, self.entities, client);

                  self.sequelizer.promise.then(
                      (res)=>{
                          console.log('socket servin')
                          self.socketServer = new SocketServer(port, self.sequelizer.routes, self.config.auth || false, self.config.secure || false);
                          callback(port);
                      })
                  .catch((err)=>{
                      console.log(err);
                  });
              })
              .catch((err)=>{
                  //should not be able to get here
                  console.log("you shouldn't be here");
                  console.log(err);
              })
        });
    }

    _createTrigger(trigger, client){
        console.log('triggerin')
        let dfd = q.defer();
        client.query(trigger, (err, res)=>{
            if(err){
                //we don't want errors to cause failure (we expect errors), so don't reject
                dfd.resolve(err);
            } else {
                //resolve if successful
                dfd.resolve(res)
            }
        });
        return dfd.promise;
    }
}

module.exports = WrestServer;
