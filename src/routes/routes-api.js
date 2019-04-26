let express = require('express');
let jwt = require ('jsonwebtoken');
let router = express.Router();
let jsonfile = require('jsonfile');
let mysql = require('mysql');
let EventEmitter = require('events');

let logger = require('../lib/logger').logger;

const emitter = new EventEmitter();
let configDBfile = './config-db.json'
let configDB = jsonfile.readFileSync(configDBfile)

let db = mysql.createConnection(configDB);


router.post('/login_check', (req, res) => {
   
    logger.debug(JSON.stringify(req.body));

    const user = req.body;
    const token = jwt.sign({user}, 'secret_key');
    

    res.status(200).json({
        message: `Logged as ${user.username}`,
        token: token
    });
});

router.get('/lists/all', tokenCheck, (req, res) => {
    
    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
          res.status(500).send("Unexpected error");
        } else {
          res.status(200).json([data]);
        }
      });
});

router.get('/lists/new/:name', tokenCheck, (req, res) => {

    let nameTodo = req.params.name;
    let idTodo = 0;
    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
            res.status(500).send("Unexpected error");
        }
        else {
            
            db.query(`INSERT INTO TodoProject.List (name) VALUES ('${nameTodo}');`, (err, result, fields) => {
                if (err) {
                    logger.error(`An error occured during the "${nameTodo}" todo list creation`);
                    throw err;
                }
               
                // Get the id of the inserted row
                idTodo = result.insertId;
                emitter.emit('NewTodoDone')
                console.log(idTodo + ' Dans query')
            })
            

            emitter.on('NewTodoDone', () => {
                console.log(idTodo + ' Aprs query')
                res.status(200).json({
                    id: idTodo,
                    name: nameTodo,
                    nb_tasks: 0
                });
            })
            
        }
    });
})

const getAllList = async () => {
    return await db.query("SELECT * FROM")
}

router.get('/protected', tokenCheck, (req, res) => {
    jwt.verify(req.token, 'secret_key', (err, data) => {
      if (err) {
        res.status(500).send("Unexpected error");
      } else {
        res.json({
          description: 'Protected information. Congrats!'
        });
      }
    });
  })


function tokenCheck(req, res, next) {
    let bearerHeader = req.headers["bearer"];

    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        let bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } 
    else {
      res.status(401).send("Invalid credentials");
    }
}

module.exports = router;