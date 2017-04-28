const tcp = require('net');
const pg = require('pg');
const q = require('q');
const Sequelizer = require('./sql/sequelize.js').Sequelizer;
const models = require('./sql/sequelize.js').models;
const functions = require('./sql/functions.js');
const httpParser = require('./http-parser/http-parser.js');
const Response =  require('./http-parser/response.js');

const pgConString = "postgres://wrest_web:dev@wrest_postgres:5432/wrest_api";

const SocketServer = require('./socket-server/socket-server.js');

let config = {
    port: 9000,
    dbUser: 'wrest_web',
    dbPassword: 'dev',
    dbHost: 'wrest_postgres',
    dbName: 'wrest_api',
    auth: (authentication, info)=>{
        console.log(authentication.split(','));
        return authentication.split(',')[1] === ' token'
    }
    // secure: {
    //     keyPath: './wrest_network.key',
    //     certPath: './wrest_network.cert'
    // }
}

class WrestServer{

    constructor(config, entities){
        this.config = config;
        this.pgStringTemplate = `postgres://${config.dbUser}:${config.dbPassword}@${config.dbHost}:5432/${config.dbName}`
        this.entities = entities;
    }

    listen(port){
        let self = this;
        pg.connect(this.pgStringTemplate, (err, client)=>{
          if(err) {
            console.log(err);
          }

          let triggerPromises = Object.keys(functions).map((key)=> self._createTrigger(functions[key], client));

          Promise.all(triggerPromises)
              .then((allResults)=>{
                  self.sequelizer = new Sequelizer(config, self.entities, client);

                  self.sequelizer.promise.then(
                      (res)=>{
                          self.socketServer = new SocketServer(port, self.sequelizer.routes, config.auth || false, config.secure || false);
                      })
                  .catch((err)=>{
                      console.log(err);
                  });
              })
              .catch((err)=>{
                  //should not be able to get here
              })
        });
    }

    _createTrigger(trigger, client){
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

let wrestServer = new WrestServer(config, models);
wrestServer.listen(9000);
