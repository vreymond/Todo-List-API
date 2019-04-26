let express = require('express');
let jwt = require ('jsonwebtoken');
let router = express.Router();
let jsonfile = require('jsonfile');
let mysql = require('mysql');

let logger = require('../lib/logger').logger;


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

router.get('/lists/new', (req, res) => {
    
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