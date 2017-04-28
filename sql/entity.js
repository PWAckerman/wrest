const Sequelize = require('sequelize');

let defaultMethods = {
    'POST': (socket, data, entity, queries) => {
        entity.create(data).then((ent)=>{
            console.log('POSTED');
        }).catch((err)=>{
            socket.send(JSON.stringify({error: err}))
        });
    },
    'GET': (socket, data, entity, queries)=>{
        if(queries){
            console.log(queries);
            queries = { where: queries, raw : true }
        } else {
            queries = { raw : true }
        }
        entity.findAll(queries).then((results)=>{
            socket.send(JSON.stringify({SELECT: results}));
        }).catch((err)=>{
            socket.send(JSON.stringify({error: err}))
        });
    },
    'PATCH': (socket, data, entity, queries)=>{
        if(queries){
            queries = { where: queries, raw : true }
        } else {
            queries = { raw : true }
        }
        let primaryKey = entity.primaryKeyAttributes[0];
        let whereObject = {};
        try {
            whereObject[primaryKey] = data[primaryKey];
        } catch(e){
            socket.send(JSON.stringify({error: 'Primary Key reference not included or does not match.'}))
        }
        console.log(data);
        console.log(whereObject);
        entity.update(data, {where: whereObject, raw: true })
            .then((results)=>{
                console.log('UPDATED');
            })
            .catch((err)=>{
                socket.send(JSON.stringify({error: err}))
            })
    },
    'DELETE': (socket, data, entity, queries)=>{
        let primaryKey = entity.primaryKeyAttributes[0];
        let whereObject = {};
        try {
            whereObject[primaryKey] = data[primaryKey];
        } catch(e){
            socket.send(JSON.stringify({error: 'Primary Key reference not included or does not match.'}))
        }
        entity.destroy({where: whereObject })
            .then((results)=>{
                console.log('DELETED');
            })
            .catch((err)=>{
                socket.send(JSON.stringify({error: err}))
            })
    }
}

class Entity{
    constructor(name, model, auth, methods = defaultMethods) {
        this.auth = auth || false;
        this.name = name;
        this.methods = methods;
        this.model = model;
    }

    setMethodHandler(method, handler){
        this.methods[method] = handler;
    }
}

module.exports = Entity;
