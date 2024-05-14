const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Get route

const routes = require('./routes');

const app = express();
const server = http.createServer(app);
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

try{
    app.listen(4000, '127.0.0.1', () => {
        console.log("server running");
    });

    app.use('/auth', routes);
} catch(err) {
    console.log("error", err);
}

const onClose = () => {
    process.exit();
}

process.on("SIGTERM", onClose);
process.on("SIGINT", onClose);
process.on("uncaughtException", onClose);
