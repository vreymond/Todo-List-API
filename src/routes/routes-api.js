// Modules requirement
let express = require('express');
let jwt = require ('jsonwebtoken');
let router = express.Router();
let jsonfile = require('jsonfile');
let mysql = require('mysql');
let bcrypt = require('bcrypt');
let uuidv4 = require('uuid/v4');

// Files requirement
let logger = require('../lib/logger').logger;

let configDBfile = './config-db.json'
let configDB = jsonfile.readFileSync(configDBfile)
let db = mysql.createConnection(configDB);
// Generate a secret key using uuid module
let secret_key = uuidv4();


/*
-----------------------------------------------
                Auth route
-----------------------------------------------
*/

// Login_check route, give a token to a client if perfectly logged
router.post('/login_check', (req, res) => {

    let user = req.body;
    // checking the req.body object
    let keys = Object.keys(user);
    if (keys.length !== 2 || !keys.includes('username') || !keys.includes('password')) {
        return res.status(400).send('Json logs must contain only the "username" and "password" keys'); 
    }
    let username = user.username;
    let password = user.password;
    let passHash;
   
    let query = `SELECT * FROM TodoProject.User WHERE EXISTS 
    (SELECT username FROM TodoProject.User WHERE username="${username}")`

    db.query(query, (err , result) => {

        if (err) {
            logger.error(`An error occured during login statement`, err);
            return res.status(500).send("Unexpected error");
        }

        if (result.length === 0) {
            return res.status(401).send(`Username "${username}" doesn't exists.`);
        }

        for (let elem of result) {
            if (elem.username === username) passHash = elem.password
        }
        // hash comparison using bcrypt (hash stored in db and the password)
        bcrypt.compare(password, passHash, function(err, bcryptRes) {
            
            logger.debug(bcryptRes);

            if (!bcryptRes){
                return res.status(401).send(`Password incorrect`);
            } 
            else {
                logger.info(`User "${username}" has just logged`);
                // Token generator with secret key
                let token = jwt.sign(req.body, secret_key);
                // Returning the token to client
                res.status(200).json({
                    token: token
                });
            }
        });
    })
});

/*
-----------------------------------------------
                Lists routes
-----------------------------------------------
*/

/* Retrieve all todo lists stored in the database. 
   This is a protected route with JWT */
router.get('/lists/all', tokenCheck, (req, res) => {
    
    let queryLists = `SELECT * FROM TodoProject.List;`;
    let queryCountTasks = `SELECT TodoListName, COUNT(TodoListName) FROM TodoProject.Task 
    WHERE TodoListName IS NOT NULL GROUP BY TodoListName`

    // Token checking
    jwt.verify(req.token, secret_key, (err, data) => {

        if (err) {
          return res.status(401).send("Access token is missing or invalid");
        } 
        else {
            db.query(queryLists, (err, result) => { 
                if (err) return res.status(500).send("Unexpected error");
                db.query(queryCountTasks, (err, resultCount) => {

                    if (err) return res.status(500).send("Unexpected error");
                    logger.debug(`Tasks count results: \n ${JSON.stringify(resultCount)}`);

                    // Catching every results case (empty or not)
                    if (resultCount.length === 0) {
                        for (let i in result) {
                            result[i].nb_tasks = 0;
                        }
                    }
                    else {
                        for (let i in result) {
                            if (!resultCount[i]){
                                result[i].nb_tasks = 0;
                            }
                            else {
                                result[i].nb_tasks = resultCount[i]["COUNT(TodoListName)"];
                            }
                        }
                    }
                    // Send an array of all todo lists.
                    res.status(200).json(result);
                })
            })
        }
    });
});

/* Create a new todo list with name as query paramater. 
   This is a protected route with JWT */
router.get('/lists/new', tokenCheck, (req, res) => {

    let nameTodo = req.query.name;
    // checking the req.query object
    if (!nameTodo) return res.status(400).send("The name of the new list is missing");
    let idTodo = 0;
    let queryNew = `INSERT INTO TodoProject.List (name) VALUES ('${nameTodo}');`;

    // Token checking
    jwt.verify(req.token, secret_key, (err, data) => {
        if (err) {
           return res.status(401).send("Access token is missing or invalid");
        }
        else {
            db.query(queryNew, (err, result, fields) => {

                if (err) {
                    logger.error(`An error occured during the "${nameTodo}" todo list creation`, err);
                    return res.status(500).send("Unexpected error");
                }
                logger.debug(`"${nameTodo}" created!`);

                // Get the id of the inserted row
                idTodo = result.insertId;
                // Send confirmation of the created list
                res.status(200).send({
                    id: idTodo,
                    name: nameTodo,
                    nb_tasks: 0
                });
            })
        }
    });
});

/*
-----------------------------------------------
                Tasks routes
-----------------------------------------------
*/

/* Create a new task in specific list with name as query paramater. 
   This is a protected route with JWT */
router.get('/list/:id/new-task', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let nameTask = req.query.name;
    // checking the req.query object
    if (!nameTask) return res.status(400).send("The name of the new task is missing");

    let idTask = 0;
    let queryID = `SELECT id FROM TodoProject.List WHERE id = ${idTodo}`;
    let queryInsertTask = `INSERT INTO TodoProject.Task (TodoListName, name, status) 
    VALUES ((SELECT name FROM TodoProject.List WHERE id = ${idTodo}), '${nameTask}', 'todo')`

    // Token checking
    jwt.verify(req.token, secret_key, (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }
        else {
            db.query(queryID, (err, result) => {
                if (err) {
                    return res.status(500).send("Unexpected error");
                } 
                
                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(queryInsertTask, (err, result) => {
                        if (err) {
                            logger.error(`An error occured during the "${nameTask}" task creation`, err);
                            return res.status(500).send("Unexpected error");
                        }
                        logger.debug(`"${nameTask}" created into the todolist ${idTodo}!`)
        
                        idTask = result.insertId;
                        
                        // Send confirmation of the created task
                        res.status(200).send({
                            id: idTask,
                            name: nameTask,
                            status: 'todo'
                        });
                    })
                }
            }) 
        }
    })
});


/* Retrieve all tasks from a specific todo list. 
   This is a protected route with JWT */
router.get('/list/:id/tasks', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let queryID = `SELECT id FROM TodoProject.List WHERE id = ${idTodo}`;
    let queryTasks = `SELECT * FROM TodoProject.Task WHERE TodoListName = (SELECT name FROM
        TodoProject.List WHERE id = ${idTodo})`;
    
    let taskList = [];
    
    // Token checking
    jwt.verify(req.token, secret_key, (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }

        else {
            db.query(queryID, (err, result) => {
                if (err) return res.status(500).send("Unexpected error");
                
                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(queryTasks, (err, result) => {
                        if (err) return res.status(500).send("Unexpected error");

                        // Building the response (array of tasks)
                        for (let elem of result) {
                            let obj = {
                                "id": elem.id,
                                "name": elem.name,
                                "status": elem.status
                            }
                            taskList.push(obj)
                        }
                        // Sending an array of all tasks in a todo list
                        res.status(200).send(taskList);
                    });
                }
            })
        }
    })
});

/* Retrieve all tasks from a specific todo list. 
   This is a protected route with JWT */
router.get('/list/:id/update-task', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let task_id = req.query.task_id;
    // Checking req.query obj
    if (!task_id) return res.status(400).send("Task id is missing in request");
    let status = req.query.status;
    // Checking req.query obj
    if (!status) return res.status(400).send("Task status is missing in request");
    // Checking req.query value
    if (!["todo", "done"].includes(status)) return res.status(400).send("Status task must be 'todo or done'");

    // Token checking
    jwt.verify(req.token, secret_key, (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }

        else {
            let queryUpdate = `UPDATE TodoProject.Task SET status = "${status}" WHERE id = ${task_id};`;
            let queryName = ` SELECT name FROM TodoProject.Task WHERE id = ${task_id};`;

            db.query(`SELECT id FROM TodoProject.List WHERE id = ${idTodo}`, (err, result) => {
                if (err) return res.status(500).send("Unexpected error");

                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(queryUpdate + queryName, (err, result) => {

                        if (err) return res.status(500).send("Unexpected error");
                        if(result[1].length === 0) return res.status(500).send("Unexpected error");

                        logger.debug(`"${result[1][0].name}" task updated to: "${status}"`);
                        // Sending the updated task
                        res.status(200).send({
                            id: task_id,
                            name: result[1][0].name,
                            status: status
                        })
                    })
                }
            })
        }   
    })
});

// Token check function that verify the header of requests
function tokenCheck(req, res, next) {
    let bearerHeader = req.headers["bearer"];

    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        let bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } 
    else {
        res.status(401).send("Access token is missing or invalid");
    }
}

module.exports = router;