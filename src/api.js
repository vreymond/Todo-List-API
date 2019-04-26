// Packages / modules requirement
let program = require('commander');
let express = require('express');
let mysql = require('mysql');
let EventEmitter = require('events');
let jsonfile = require('jsonfile')

let logger = require('./lib/logger').logger;
let setLogLevel = require('./lib/logger').setLogLevel;
let apiRoutes = require('./routes/routes-api');
//let dbConnect = require('./db-connect');

const emitter = new EventEmitter();
let app = express();


// Commands options manager
program
    .version('0.0.1')
    .option('-p, --portAPI <portAPI>', 'Set API port listening')
    .option('-P, --portDB <portDB>', 'Set DB port')
    .option('-d, --dbHost <dbHost>', 'Set Hostname for the mysql DB')
    .option('-u, --dbUser <userDBName>', 'Set DB username')
    .option('-w, --password <passwordDB>', 'Set DB password')
    .option('-l, --loglevel <logLevel', 'Set log level', setLogLevel)
    .parse(process.argv);


// Get logins from commands options manager
let portAPI, portDB,dbHost, dbUser, passwordDB;

program.portAPI ? portAPI = program.portAPI : portAPI = 3000;
program.portDB ? portDB = program.portDB : portDB = 8889;
program.dbHost ? dbHost = program.dbHost : dbHost = 'localhost';
program.dbUser ? dbUser = program.dbUser : dbUser = 'root';
program.password ? passwordDB = program.password : passwordDB = 'root';


logger.info(`***** Starting Todo List API *****`);

let file = './config-db.json';
let configUpdate = {
    host: dbHost,
    port: portDB,
    user: dbUser,
    password: passwordDB
}

jsonfile.writeFileSync('config-db.json', configUpdate, { spaces: 2 })

let db = mysql.createConnection(configUpdate)

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

        emitter.emit('dbCreated');

    })

    emitter.on('dbCreated', () => {
        
        // Creation of the Users table into TodoProject database
        let tableUser = "CREATE TABLE IF NOT EXISTS TodoProject.User (id INT AUTO_INCREMENT PRIMARY KEY,\
            username VARCHAR(255) UNIQUE, password VARCHAR(255))";
        createTableDB(tableUser, "User");
       
        // Creation of the List table into TodoProject database
        let tableList = "CREATE TABLE IF NOT EXISTS TodoProject.List (id INT AUTO_INCREMENT PRIMARY KEY,\
            name VARCHAR(255))";
        createTableDB(tableList, "List");

        // Creation of the Task table into TodoProject database
        let tableTask = "CREATE TABLE IF NOT EXISTS TodoProject.Task (id INT AUTO_INCREMENT PRIMARY KEY,\
            name VARCHAR(255), status ENUM ('todo', 'done') NOT NULL)";
        createTableDB(tableTask, "Task");
        
    })
})

function createTableDB (sql, name) {
    db.query(sql, (err,result) => {
        if (err) {
            logger.error(`An error occured during the table "${name}" creation`);
            throw err;
        }
        logger.debug(`Table "${name}" created`);
        if (name == "Task") {
            db.query("INSERT IGNORE INTO TodoProject.User (username, password) VALUES ('test', '1234')", (err, result) => {
                if (err) {
                    logger.error(`An error occured during the table "${name}" creation`);
                    throw err;
                }
                logger.debug(`Dummy "test" user created`);
            });
            emitter.emit('databaseRDY');
        }
    })
}


emitter.on('databaseRDY', () => {
    logger.info(`Database "TodoProject" successfully created!`);
    app.listen(portAPI, () => logger.info(`Server listening on port ${portAPI} \n`));

    app.use((req, res, next) => {
        logger.debug(`${new Date().toString()} => ${req.originalUrl}`, req.body);
        next();
    })

    app.use(express.static('public'));
    // Replace body-parser in express 4.16+
    app.use(express.json());
    app.use(apiRoutes);
})

