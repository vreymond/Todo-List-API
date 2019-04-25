// Packages / modules requirement
let program = require('commander');
let express = require('express');
let mysql = require('mysql');
let logger = require('./lib/logger').logger;
let setLogLevel = require('./lib/logger').setLogLevel;


let app = express();


// Commands options manager
program
    .version('0.0.1')
    .option('-p, --portAPI <portAPI>', 'Set API port listening')
    .option('-P, --portDB <portDB>', 'Set DB port')
    .option('-d, --dbHost', 'Set Hostname for the mysql DB')
    .option('-u, --dbUser <userDBName>', 'Set DB username')
    .option('-w, --password <passwordDB>', 'Set DB password')
    .option('-v, --verbosity <logLevel', 'Set log level', setLogLevel)
    .parse(process.argv);


// Get logins from commands options manager
let portAPI, portDB,dbHost, dbUser, passwordDB;

program.portAPI ? portAPI = program.portAPI : portAPI = 3000;
program.portDB ? portDB = program.portDB : portDB = 8889;
program.dbHost ? dbHost = program.dbHost : dbHost = 'localhost';
program.dbUser ? dbUser = program.dbUser : dbUser = 'root';
program.password ? passwordDB = program.password : passwordDB = 'root';


logger.info(`***** Starting Todo List API *****`);

app.listen(portAPI, () => logger.info(`Server listening on port ${portAPI} \n`));

// Mysql DB connection
let db = mysql.createConnection({
    host: dbHost,
    port: portDB,
    user: dbUser,
    password: passwordDB
});

db.connect(err => {
    if (err) {
        logger.error(`An error occured during the connection on the MySQL server.`)
        throw err;
    }
    logger.info(`Connected to MySQL server on: "${dbHost}:${portDB}"`);

    db.query("CREATE DATABASE IF NOT EXISTS TodoProject", (err, result) => {
        if (err) {
            logger.error(`An error occured during the database creation`);
            throw err;
        }

        logger.info(`Database "TodoProject" successfully created!`);

    })
})



