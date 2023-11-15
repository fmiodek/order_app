// Server für Websocket Communication
const socketServer = require("http").createServer();
const serverPort = 8080; 
const { exec } = require('child_process');
const io = require("socket.io")(socketServer, {
    cors: {origin: "*"}
});

io.on("connection", socket => {
    console.log("a user connected");

    socket.on("message", message => {
        io.emit("message", message);
    });
})

socketServer.listen(serverPort, () => console.log(`listening on port ${serverPort}`));






// Server für Frontend
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const appPort = 3000; 

app.use(bodyParser.json());
app.use(express.static("../app"));

app.listen(appPort, () => {
    console.log(`listening on port ${appPort}`);
});



// Database
// status codes for db
const ZUBEREITUNG = 1;
const ABHOLUNG = 2;
const ABGEHOLT = 3;
const GELÖSCHT = 0;


const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('orders.db');
db.run('CREATE TABLE IF NOT EXISTS orders (id INTEGER, ingredients TEXT, status INTEGER)', (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table created successfully');
    }
});


// Load existing data from database on server start

const inPrep = [];
const readyForPickup = [];
let latestOrderNum = 0;

db.all('SELECT * FROM orders', (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err);
      return;
    }
    rows.forEach( row => {
        let orderNum = row["id"];
        if (orderNum > latestOrderNum) {
            latestOrderNum = orderNum;
        } 

        if (row["status"] === 1) {
            let id = row["id"];
            let status = row["status"];
            let item = {id: id, status: status}
            inPrep.push(item);
        }
        else if (row["status"] === 2) {
            let id = row["id"];
            let status = row["status"];
            let item = {id: id, status: status};
            readyForPickup.push(item);
        }
    })
});

// load content from database to frontend
app.get('/load', (req, res) => {

    const data = {
        "prep": inPrep,
        "pickup": readyForPickup,
        "latestId": latestOrderNum
    };
  
    // Prepare JSON response
    res.json(data);
});


// get data from frontend
app.post('/submit', (req, res) => {
    const data = req.body; // Access the submitted data
    const id = data.id;
    const ingredients = data.ingredients.join(', ');
  
    // save to database
    dbInsertOrder(id, ingredients);

    // send data to bash for printing
    const bashCommand = `echo "${id + "\n" + ingredients}" > test.txt`; 

    exec(bashCommand, (error, stdout, stderr) => {
        if (error) {
        console.error(`Fehler beim Ausführen des Bash-Befehls: ${error}`);
        } else {
        console.log(`Test mit ${id + "\n" + ingredients}`);
        }
    });

    res.status(200).json({ message: 'Data submitted successfully' }); // Send a successful response
});

  app.post('/update', (req, res) => {
    
    const data = req.body; 
    const id = data.id;
    const status = data.status;
  
    // update database
    dbUpdateStatus(id, status);
  
    res.status(200).json({ message: 'Data submitted successfully' }); // Send a successful response
});




// functions for handling database
function dbInsertOrder(id, ingredients) {
    db.run(`INSERT INTO orders (id, ingredients, status) VALUES (?, ?, ?)`, [id, ingredients, 1]);
}

function dbUpdateStatus(id, status) {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
}

