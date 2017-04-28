const Sequelize = require('sequelize');
const Route = require('../router/route.js');
const cls = require('continuation-local-storage');
const Entity = require('./entity.js');
const Triggers = require('./triggers.js');
const namespace = cls.createNamespace('transactions');
const q = require('q');

Sequelize.cls = namespace;

//example of Entity, which gets passed to sequelizer
let userModel = {
                    username: {type: Sequelize.STRING, allowNull: false},
                    birthday: {type: Sequelize.DATE, allowNull: false}
                }

let user = new Entity('user', userModel, true);

class Sequelizer {
    //NOTE: models is really a collection of Entity objects (Entity[])
    //keeping it models for now for 'legacy' reasons
    constructor(config, models, client){
        let self = this;
        //there is asynchronous behavior in this constructor that we might want to move out into
        //a separate initialization step
        //config defaults are for development and correspond to Docker container settings
        config = {
            dbName: config.dbName || 'wrest_api',
            dbUser: config.dbUser || 'wrest_web',
            dbPassword: config.dbPassword || 'dev',
            dbHost: config.dbHost || 'wrest_postgres'
        }
        this._dfd = q.defer();
        //this is the pg client (necessary for 'notification' event?)
        this.client = client;
        //create a new instance of Sequelize
        this.sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPassword, {
                          host: config.dbHost, //'wrest_postgres',
                          dialect: 'postgres',
                          pool: {
                            max: 5,
                            min: 0,
                            idle: 10000
                          }
                        });
        //bind this
        this._registerModel = this._registerModel.bind(this);
        this._setupListener = this._setupListener.bind(this);
        //initialize empty models object
        this.models = {};
        this.callbacks = [];
        //initialize empty routes object
        this.routes = {};
        //see above, asynchrnous behavior
        this.promise = this._dfd.promise;
        //get sequelize ready
        this.sequelize
            .authenticate()
            .then((err)=>{
                //create our service
                models.forEach((model)=>{
                    this._registerModel(model);
                    this._addRoute(model);
                });
                this.sequelize.sync().then(()=>{
                    console.log('SYNCED');
                    models.forEach((model)=>{
                        self._createTrigger(model);
                    });
                    this._setupListener();
                    this._dfd.resolve('COMPLETE');
                });
            })
            .catch((err)=>{
                console.error('Cannot connect to Postgres:', err);
                this._dfd.reject('ERR CONNECTING TO POSTGRES');
            });
    }

    _registerModel(model){

        //define the model with Sequelize and store it for further use (if necessary)
        this.models[model.name] = this.sequelize.define(model.name, model.model, {
            paranoid: true,
            underscored: true,
            freezeTableName: true
        });
    }

    _addRoute(model){
        //create Route object and map it to table name as the endpoint path
        this.routes['/' + model.name] = new Route(model.methods, model.queries, this.models[model.name], model.auth);
        //set handlers on the route for each relevant HTTP method
        Object.keys(this.routes['/' + model.name].methods).forEach((method)=>{
            this.routes['/' + model.name].setHandler(method, this.routes['/' + model.name].methods[method]);
        });
    }

    _createTrigger(model){
        //associate a notification trigger for every insert on the model's table
        let self = this;
        let triggers = new Triggers(model.name);
        console.log(triggers);
        let triggersArr = [triggers.INSERT, triggers.UPDATE, triggers.DELETE];
        console.log(triggersArr);
        let promises = triggersArr.map((trigger)=>{
            console.log(trigger);
            let dfd = q.defer();
            self.client
                .query(trigger, (err, res)=>{
                    if(err){
                        dfd.resolve(err);
                    } else {
                        dfd.resolve(res);
                    }
                })
            return dfd.promise;
        });
        Promise.all(promises)
            .then((res)=>{
                console.log(res);
            })
            .catch((errs)=>{
                console.log(errs);
            })
    }

    _setupListener(){
        //LISTEN to the postgres notification channel 'watchers'
        this.client.query(`LISTEN watchers`);
        //bind this to self for closure
        let self = this;
        //'notification' is the event emitted from postgres on the channel (see initial db setup)
        //msg is the message we receive from postgres (see _parseMessage)
        //we only use pg-node for the notification channel, queries through sequelize
        this.client.on('notification', function(msg) {
            //parse the message so we can handle appropriately
            console.log(msg);
             let message = self._parseMessage(msg.payload);
             self.sequelize
                .query(`SELECT * FROM "${message.table}" WHERE ${message.key} = ${message.value}`)
                .spread((results,metadata)=>{
                    if(results){
                        self.routes['/' + message.table].sockets.forEach((socket)=>{
                            //socket may be undefined if previously terminated
                            if(socket){
                                //if there is a query string, only send if satisfied
                                if(socket.queries){
                                    //check to make sure every query parameter is satisfied by new row
                                    let everyQuerySatisfied = Object
                                                            .keys(socket.queries)
                                                            .map((key)=>{
                                                                return results[0][key] ? results[0][key] === socket.queries[key] : false;
                                                            })
                                                            .every((x) => x === true);
                                    console.log(socket.queries);
                                    console.log('satsified?', everyQuerySatisfied);
                                    if(everyQuerySatisfied){
                                        let response = {}
                                        response[message.command] = results;
                                        socket.send(JSON.stringify(response))
                                    } else {
                                        //do nothing
                                    }
                                //if there are no queries (general subscribe) send object
                                } else if(!socket.queries){
                                  let response = {}
                                  response[message.command] = results;
                                  socket.send(JSON.stringify(response));
                                }
                            }
                        })
                    }
                })
                .catch((err)=>{
                    console.log('err', err)
                })
                //if there are callbacks, perform callbacks now
             self.callbacks.forEach((callback)=>{
                 return callback();
             })
           });
    }

    _parseMessage(msg){
        msg = msg.split(',');
        return {
            table: msg[0],
            key: msg[1],
            value: msg[2],
            command: msg[3]
        }
    }

    accessModel(modelName){
        return this.models[modelName];
    }

    registerCallbacks(callback){
        this.callbacks.push(callback);
    }
}


module.exports = {models: [user], Sequelizer};
