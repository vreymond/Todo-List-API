let express = require('express');
let jwt = require ('jsonwebtoken');
let router = express.Router();
let jsonfile = require('jsonfile');
let mysql = require('mysql');

let logger = require('../lib/logger').logger;


let configDBfile = './config-db.json'
let configDB = jsonfile.readFileSync(configDBfile)

let db = mysql.createConnection(configDB);


/*
-----------------------------------------------
                Auth route
-----------------------------------------------
*/

router.post('/login_check', (req, res) => {
    let user = req.body;
    let username = user.username;
    let password = user.password;
    let query = `SELECT EXISTS (SELECT * FROM TodoProject.User WHERE
        username="${username}" AND password="${password}");`;

    logger.debug(`Receiving logs from client...\n \t ${JSON.stringify(user)}`);

    db.query(query, (err , result) => {

        if (err) {
            logger.error(`An error occured during login statement`);
            return res.status(500).send("Unexpected error");
        }

        // Testing the existence of the user in the database
        if (Object.values(result[0])[0] === 0) {

            logger.error(`No user named "${username}" found in database or password is incorrect`)
            res.status(401).send("Invalid credentials");
        }
        if (Object.values(result[0])[0] === 1) {
            
            logger.info(`User "${username}" has just logged`);
            let token = jwt.sign(req.body, 'secret_key');
            res.status(200).json({
                token: token
            });
        }        
    })
});

/*
-----------------------------------------------
                Lists routes
-----------------------------------------------
*/
router.get('/lists/all', tokenCheck, (req, res) => {
    
    let queryLists = `SELECT * FROM TodoProject.List;`;
    let queryCountTasks = `SELECT TodoListName, COUNT(TodoListName) FROM TodoProject.Task 
    WHERE TodoListName IS NOT NULL GROUP BY TodoListName`

    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
          return res.status(401).send("Access token is missing or invalid");
        } else {
            db.query(queryLists, (err, result) => {

                db.query(queryCountTasks, (err, resultCount) => {
                    if (err) return res.status(500).send("Unexpected error");

                    logger.debug(`Tasks count results: \n ${JSON.stringify(resultCount)}`);
                    for (let i in resultCount) {
                        result[i].nb_tasks = resultCount[i]["COUNT(TodoListName)"];
                    }
                    
                    res.status(200).json(result);
                })
            })
        }
    });
});

router.get('/lists/new', tokenCheck, (req, res) => {

    let nameTodo = req.query.name;
    if (!nameTodo) return res.status(400).send("The name of the new list is missing");
    let idTodo = 0;

    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
           return res.status(401).send("Access token is missing or invalid");
        }
        else {
            
            db.query(`INSERT INTO TodoProject.List (name) VALUES ('${nameTodo}');`, (err, result, fields) => {
                if (err) {
                    logger.error(`An error occured during the "${nameTodo}" todo list creation`);
                    return res.status(500).send("Unexpected error");
                }
               
                // Get the id of the inserted row
                idTodo = result.insertId;
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

router.get('/list/:id/new-task', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let nameTask = req.query.name;
    if (!nameTask) return res.status(400).send("The name of the new task is missing");

    let idTask = 0;

    let query = `INSERT INTO TodoProject.Task (TodoListName, name, status) 
    VALUES ((SELECT name FROM TodoProject.List WHERE id = ${idTodo}), '${nameTask}', 'todo')`

    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }
        else {
            db.query(`SELECT id FROM TodoProject.List WHERE id = ${idTodo}`, (err, result) => {
                if (err) {
                    return res.status(500).send("Unexpected error");
                } 
                
                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(query, (err, result) => {
                        if (err) {
                            logger.error(`An error occured during the "${nameTask}" task creation`);
                            return res.status(500).send("Unexpected error");
                        }
        
                        idTask = result.insertId;
                        
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


router.get('/list/:id/tasks', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let query = `SELECT * FROM TodoProject.Task WHERE TodoListName = (SELECT name FROM
        TodoProject.List WHERE id = ${idTodo})`;
    
    let taskList = [];

    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }

        else {
            db.query(`SELECT id FROM TodoProject.List WHERE id = ${idTodo}`, (err, result) => {
                if (err) return res.status(500).send("Unexpected error");
                
                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(query, (err, result) => {

                        for (let elem of result) {
                            let obj = {
                                "id": elem.id,
                                "name": elem.name,
                                "status": elem.status
                            }
                            taskList.push(obj)
                        }
                        
                        res.status(200).send(taskList);
                    });
                }
            })
        }
    })
});


router.get('/list/:id/update-task', tokenCheck, (req, res) => {
    let idTodo = req.params.id;
    let task_id = req.query.task_id;
    if (!task_id) return res.status(400).send("Task id is missing in request");
    let status = req.query.status;
    if (!status) return res.status(400).send("Task status is missing in request");
    if (!["todo", "done"].includes(status)) return res.status(400).send("Status task must be 'todo or done'");


    jwt.verify(req.token, 'secret_key', (err, data) => {
        if (err) {
           res.status(401).send("Access token is missing or invalid");
        }

        else {
            let query1 = `UPDATE TodoProject.Task SET status = "${status}" WHERE id = ${task_id};`;
            let query2 = ` SELECT name FROM TodoProject.Task WHERE id = ${task_id}`

            db.query(`SELECT id FROM TodoProject.List WHERE id = ${idTodo}`, (err, result) => {
                if (err) return res.status(500).send("Unexpected error");

                if (result.length === 0) {
                    res.status(404).send(`The list id "${idTodo}" doesn't exists.`);
                }
                else {
                    db.query(query1 + query2, (err, result) => {
                       
                        if (err) return res.status(500).send("Unexpected error");
                        
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

function tokenCheck(req, res, next) {
    let bearerHeader = req.headers["bearer"];

    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        let bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } 
    else {
        res.status(500).send("Unexpected Error");
    }
}

module.exports = router;