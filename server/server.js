// Server für Websocket Communication
const socketServer = require("http").createServer();
const serverPort = 8080; 
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

const frontServer = app.listen(appPort, () => {
    console.log(`listening on port ${appPort}`);
});

// for printing
const { exec } = require('child_process');
const shellOptions = {
    shell: '/bin/bash',
}

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
app.post('/insert', (req, res) => {
    const data = req.body; // Access the submitted data
    const id = data.id;
    const ingredients = data.ingredients.join(', ');

    // save item in inPrep Array
    let item = {id: id, status: 1};
    inPrep.push(item);
    // update id
    latestOrderNum = id; 
  
    // save to database
    dbInsertOrder(id, ingredients);

    printOrder(id, ingredients);

    res.status(200).json({ message: 'Data submitted successfully' }); // Send a successful response
});


app.post('/update', (req, res) => {
    
    const data = req.body; 
    const id = data.id;
    const status = data.status;
  
    // update Arrays and latestOrderNum
    item = {id: id, status: status};
    switch(status) {
        case 0:
            indexToRemove = inPrep.findIndex( item => item.id === id);
            if (indexToRemove !== -1) {
                inPrep.splice(indexToRemove, 1);
            }
            break;
        case 1:
            indexToRemove = readyForPickup.findIndex( item => item.id === id);
            if (indexToRemove !== -1) {
                readyForPickup.splice(indexToRemove, 1);
                inPrep.push(item);
            } 
            break;
        case 2:
            indexToRemove = inPrep.findIndex( item => item.id === id);
            if (indexToRemove !== -1) {
                inPrep.splice(indexToRemove, 1);
                readyForPickup.push(item);
            }
            break;
        case 3:
            indexToRemove = readyForPickup.findIndex( item => item.id === id);
            if (indexToRemove !== -1) {
                readyForPickup.splice(indexToRemove, 1);
            }
            break;
    }

    // update database
    dbUpdateStatus(id, status);
  
    res.status(200).json({ message: 'Data submitted successfully' }); // Send a successful response
});

app.get('/print', (req, res) => {    
    
    db.all(`SELECT ingredients as Variante, COUNT(*) as Anzahl FROM orders WHERE status != 0 GROUP BY ingredients ORDER BY Anzahl DESC`, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        /*
        console.log("Anzahl verkaufter Flammkuchen");
        console.log("-----------------------------");
        rows.forEach( row => {
            console.log(`${row.Variante}: ${row.Anzahl}`);
            sum += Number(row.Anzahl);
        });
        console.log("------------------------------");
        console.log(`Gesamt verkauft: ${sum}`);
        */

        let selledProducts = "";
        let sum = 0;
        rows.forEach( row => {
            selledProducts = selledProducts + `${row.Variante}: ${row.Anzahl}\n`;
            sum += Number(row.Anzahl);
        });
        printSells(selledProducts, sum);
    });

    res.send('Server-Funktion erfolgreich ausgelöst');
});


// functions for handling database
function dbInsertOrder(id, ingredients) {
    db.run(`INSERT INTO orders (id, ingredients, status) VALUES (?, ?, ?)`, [id, ingredients, 1]);
}

function dbUpdateStatus(id, status) {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
}


// functions for printing
function printOrder(id, ingredients) {
    const bashCommand = 
`echo -e "\\x1d\\x21\\x22
OrderNr.:
${id}
\\x1d\\x21\\x11
${ingredients}\n\n
\\x1d\\x56\\x41\\x10
\\x1d\\x21\\x22
OrderNr.:
${id}
\\x1d\\x21\\x11
${ingredients}\n\n
\\x1d\\x56\\x41\\x10" > /dev/usb/lp0`;
    
    exec(bashCommand, shellOptions, (error, stdout, stderr) => {
        if (error) {
        console.error(`Fehler beim Ausführen des Bash-Befehls: ${error}`);
        } else {
        console.log(id);
        }
    });
};

function printSells(selledProducts, sum) {
    const bashCommand = 
`echo -e "\\x1d\\x21\\x00
< Anzahl verkaufter Flammkuchen >\n
${selledProducts}
Gesamt verkauft: ${sum}\n\n
\\x1d\\x56\\x41\\x10" > /dev/usb/lp0`;

    exec(bashCommand, shellOptions, (error, stdout, stderr) => {
        if (error) {
        console.error(`Fehler beim Ausführen des Bash-Befehls: ${error}`);
        } else {
        console.log(sum);
        }
    });    
};


// Handle Ctrl+C in sehll to gracefully shut down the server
process.on('SIGINT', () => {
    console.log(' Received SIGINT. Closing server gracefully...');
    
    // Close the servers
    frontServer.close(() => {
        console.log('Frontend Server closed. Exiting process...');
    });
    socketServer.close(() => {
        console.log('Websocket Server closed. Exiting process...');
    });
});


/*
Overview print commands:
Schriftgröße x1: \\x1d\\x21\\x00
Schriftgröße x2: \\x1d\\x21\\x11
Schriftgröße x2: \\x1d\\x21\\x22
Paper-Cut: \\x1d\\x56\\x41\\x10
*/