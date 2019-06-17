// Modules requirement
let program = require('commander');
let express = require('express');
require('dotenv').config();
let mysql = require('mysql');
let EventEmitter = require('events');
let jsonfile = require('jsonfile');
let bcrypt = require('bcrypt');

// Files requirement
let logger = require('./lib/logger').logger;
let setLogLevel = require('./lib/logger').setLogLevel;
let apiRoutes = require('./routes/routes-api');

const emitter = new EventEmitter();
const saltRounds = 10;
let app = express();


// Commands options manager
program
    .version('1.0.0')
    .option('-p, --portAPI <portAPI>', 'Set API port listening')
    .option('-P, --portDB <portDB>', 'Set DB port')
    .option('-d, --dbHost <dbHost>', 'Set Hostname for the mysql DB')
    .option('-u, --dbUser <userDBName>', 'Set DB username')
    .option('-w, --password <passwordDB>', 'Set DB password')
    .option('-l, --loglevel <logLevel', 'Set log level', setLogLevel)
    .parse(process.argv);


// Get logins from commands options manager
let portAPI, portDB, dbHost, dbUser, passwordDB;

program.portAPI ? portAPI = program.portAPI : portAPI = process.env.API_PORT;
program.portDB ? portDB = program.portDB : portDB = process.env.DB_PORT;
program.dbHost ? dbHost = program.dbHost : dbHost = process.env.DB_HOST;
program.dbUser ? dbUser = program.dbUser : dbUser = process.env.DB_USER;
program.password ? passwordDB = program.password : passwordDB = process.env.DB_PASSWORD;


logger.info(`***** Starting Todo List API *****`);

let configUpdate = {
    host: dbHost,
    port: portDB,
    user: dbUser,
    password: passwordDB,
    multipleStatements: process.env.DB_MULTIPLESTATEMENTS
}

console.log(configUpdate)
// Updating config file with given options
//jsonfile.writeFileSync('config-db.json', configUpdate, { spaces: 2 })

// Starting connection with the mysql server
let db = mysql.createConnection(configUpdate)

db.connect(err => {
    if (err) {
        logger.error(`An error occured during the connection on the MySQL server.`)
        throw err;
    }
    logger.info(`Connected to MySQL server on: "http://${dbHost}:${portDB}/"`);

    // Creation of the TodoProject database
    db.query("CREATE DATABASE IF NOT EXISTS TodoProject", (err, result) => {
        if (err) {
            logger.error(`An error occured during the database creation`);
            throw err;
        }
        // Once created, the dbCreated event is emitted
        emitter.emit('dbCreated');

    })

    // dbCreated event catched
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
            TodoListName VARCHAR(255), name VARCHAR(255), status ENUM ('todo', 'done') NOT NULL)";
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
            let usernameDummy = 'test';
            let passwordDummy = '1234';

            // Password hash
            bcrypt.hash(passwordDummy, saltRounds, (err, hash) => {
                let query = `INSERT IGNORE INTO TodoProject.User (username, password) 
                VALUES ('${usernameDummy}', '${hash}')`;

                db.query(query, (err, result) => {
                    if (err) {
                        logger.error(`An error occured during the table "${name}" creation`);
                        throw err;
                    }

                    logger.debug(`Dummy "test" user created`);
                    emitter.emit('databaseRDY');
                });
            }); 
        }
    })
}

// databaseRDY listener, starting api middlewares
emitter.on('databaseRDY', () => {
    logger.info(`Database "TodoProject" successfully created!`);
    app.listen(portAPI, () => logger.info(`Server listening on port ${portAPI} \n`));

    // Simple log that show the date and the route requested
    app.use((req, res, next) => {
        logger.debug(`${new Date().toString()} => ${req.originalUrl}`, req.body);
        next();
    })
    app.use(express.static('public'));
    // Replace body-parser in express 4.16+
    app.use(express.json());
    app.use(apiRoutes);
})

