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
    .option('-p, --port <port>', 'Set port listening', 3000)
    .option('-v, --verbosity <logLevel', 'Set log level', setLogLevel)
    .parse(process.argv);

logger.info(`***** Starting Todo List API *****`);

const PORT = program.port;

app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));