const WrestServer = require('../index.js');
const models = require('../sql/sequelize.js').models;

let config = {
    port: 9000,
    dbUser: 'wrest_web',
    dbPassword: 'dev',
    dbHost: 'wrest_postgres',
    dbName: 'wrest_api',
    // auth: (authentication, info)=>{
    //     console.log(authentication.split(','));
    //     return authentication.split(',')[1] === ' token'
    // }
    // secure: {
    //     keyPath: './wrest_network.key',
    //     certPath: './wrest_network.cert'
    // }
}

console.log('starting up!');

const wrestServer = new WrestServer(config, models);

wrestServer.listen(9000, (port)=>{
    console.log('listening on port ' + port);
});
