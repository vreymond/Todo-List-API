// Logger file using winston module, facilitate console logs.

let winston = require('winston');

const config = {
    levels: {
        error: 0,
        debug: 1,
        warn: 2,
        data: 3,
        info: 4,
        verbose: 5,
        silly: 6,
        custom: 7
    },
    colors: {
        error: 'red',
      debug: 'blue',
      warn: 'yellow',
      data: 'grey',
      info: 'green',
      verbose: 'cyan',
      silly: 'magenta',
      custom: 'yellow'
    }
  };

winston.addColors(config.colors);

function createFileTransport(path="./sw-universe.log"){

    let files = new winston.transports.File({ filename: path,
        format: winston.format.combine(
        winston.format.simple()
        ) });
    return files;
}

let consoleT = new winston.transports.Console(
  { 
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
});
winston.add(consoleT);


let logLevel = 'info';

function isLogLvl(value){
    return config.levels.hasOwnProperty(value)
}
function setLogLevel(value) {
    
    if(!isLogLvl(value))
        throw `Unrecognized logLvel "${value}"`;
    logLevel = value;
    winston.level = logLevel;
}

function setLogFile(logFilePath) {
    let fileCustomTransport = createFileTransport(logFilePath);
    winston.add(fileCustomTransport);
}

exports.logger = winston;
exports.setLogLevel = setLogLevel;