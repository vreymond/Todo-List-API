let mysql = require('mysql')
require('dotenv').config();


let db_host, db_user, db_password, db_port;

process.env.DB_HOST ? db_host = process.env.DB_HOST : missing_Env_Key("DB_HOST");
process.env.DB_USER ? db_user = process.env.DB_USER : missing_Env_Key("DB_USER");
process.env.DB_PASSWORD ? db_password = process.env.DB_PASSWORD : missing_Env_Key("DB_PASSWORD");
process.env.DB_PORT ? db_port = process.env.DB_PORT : missing_Env_Key("DB_PORT");

let db_Connection = mysql.createConnection({
    host: db_host,
    port: db_port,
    user: db_user,
    password: db_password,
    multipleStatements: true

})

db_Connection.connect(function (err) {
    if (err) {
        console.error(err);
        return;
    }
    else {
        console.log('Connection to database established');
    }
})

function missing_Env_Key(missing_Key){
    console.log(`Error encountered! ${missing_Key} is missing in ".env" file`);
}


module.exports = db_Connection;