
# Todo List API

[![NodeJs](https://img.shields.io/badge/code-NodeJs-brightgreen.svg)](https://nodejs.org/en/)
[![Javascript](https://img.shields.io/badge/code-JavaScript-blue.svg)]()
[![Mysql](https://img.shields.io/badge/db-MySQL-red.svg)](https://www.mysql.com)

This program is a REST API that allows clients to create to-do lists with tasks stored in a SQL database. 
This API is using the express architecture and a MySQL server.
Clients can access the API with a token system by using the jsonwebtoken (JWT) npm module. 

[MAMP server](https://www.mamp.info/en/) have been used for the database developpement and [Insomnia program](https://insomnia.rest/) for the client part (routes)



## Getting Started


### Prerequisites

1) Launch a SQL server of your choice on your local or distant machine (like MAMP) and get the adress (host and port), username and password of this server.

2) Installing node.js

- Mac (homebrew): 
```
brew install node
```

- Linux (packet manager):
```
sudo apt-get install nodejs npm
```

- Node website:
```
https://nodejs.org/
```



### Installing

3) Clone the repository project in the directory of your choice with:

```
git clone https://github.com/vreymond/Todo-List-API.git
```

4)  Move to the project directory, and install all npm modules dependencies needed by the program

```
npm install
```



## Program launch

- Start the SQL server
 
- To access the helping manual of the Api containing the entire options list, use the following command:

```bash
node src/api.js -h 
```
You will get:

```bash
> Usage: api [options]

Options:
  -V, --version                output the version number
  -p, --portAPI <portAPI>      Set API port listening
  -P, --portDB <portDB>        Set DB port
  -d, --dbHost <dbHost>        Set Hostname for the mysql DB
  -u, --dbUser <userDBName>    Set DB username
  -w, --password <passwordDB>  Set DB password
  -l, --loglevel <logLevel     Set log level
  -h, --help                   output usage information
```

The -l (or --loglevel) option allows you to modify the verbosity of the console logs.
To see debug level just use the following command:

```
node src/api.js -l debug
```

Ensure you start the API with the correct pool of options. Set your SQL server logs with options, like: 

```
node src/api.js -P 8080 -d <server hostname> -u <db server user> -w <password server> 
```

If no options given, the MAMP (or another server) SQL server default logs will be used.

The program will create a database named "TodoProject" into the SQL server. This database include 3 tables (User, List and Tasks). When those 3 tables are created, a dummy user is inserted into the user table for testing.


## API usage

All the routes have been tested using the [Insomnia program](https://insomnia.rest/).

### 1°) API index

You can access the API by using the URL ```http://localhost:<portAPI>/``` (default port is 3000).

### 2°) API Login check route
First of all, to check his logins the client has to use the following route:

```
http://localhost:3000/login_check
```

```
// The posted data must be in a JSON format and contains only the "username" and "password" keys:

{
	"username": "test",
	"password": "1234"
}

```

The API server will return a token to the client (generated with the JWT module):

```
{
	"token":
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJwYXNzd29yZCI6IjEyMzQi
		CJpYXQiOjE1NTY0NTc2NTR9.pm3udoXwLGhaGzTtR_SaE8N1Ep75EAYWijz6i4jAEiE"
}
```

### 3°) Manage your todo list and tasks

Once the token is generated, it needs to put it on each header of future API requests. The header name key is "bearer" and the value start by "Bearer" followed by the JWT token:

```
// Request Header:
key: "bearer"
value: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJwYXNzd29yZCI6IjEyMzQi
		CJpYXQiOjE1NTY0NTc2NTR9.pm3udoXwLGhaGzTtR_SaE8N1Ep75EAYWijz6i4jAEiE"
```

Just now the client can access the 5 following routes:

#### A - Lists routes

- Creating new list:

```
http://localhost:3000/lists/new?name=todo-test
```

The API will respond:

```
{
  "id": 1,
  "name": "todo-test",
  "nb_tasks": 0
}
```

- Show all lists stored in the database:

```
http://localhost:3000/lists/all
```
The API will return a JSON array of all todo lists created:

```
[
  {
    "id": 1,
    "name": "todo-test",
    "nb_tasks": 0
  }
]
```

#### B - Tasks routes

- Create new task into a todo list:

```
http://localhost:3000/list/{id-todo}/new-task?name=task1
```

The API will respond:

```
{
  "id": 1,
  "name": "task1",
  "status": "todo"
}
```

- Update task status

Once created, the task is marked as "todo" statement. There are only two statements for a task: "todo" or "done". If the client wants to update the task status, he uses the following route:

```
http://localhost:3000/list/{id-list}/update-task?task_id=1&status=done
```

The API will respond:

```
{
  "id": "1",
  "name": "task1",
  "status": "done"
}
```

- Show all tasks in a todo list:

```
http://localhost:3000/list/{id-list}/tasks
```

The API will respond:

```
[
  {
    "id": 1,
    "name": "task1",
    "status": "done"
  }
]
```


# Contributors

> Valentin Reymond

<a href="https://github.com/vreymond/Todo-List-API" target="_blank">**Todo List API**</a> 

[<img alt="vreymond" src="https://avatars2.githubusercontent.com/u/25683049?s=460&v=4" width="150">](https://github.com/vreymond) 

<a href="https://github.com/vreymond" target="_blank">`github.com/vreymond`</a>


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details


