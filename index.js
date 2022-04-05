// Defining exports from other files
const app = require('./server'); // Importing server.js exports
const database = require('./database'); // Importing server.js exports
const functions = require('./functions'); // Importing functions.js exports

// Doing the json fetch from api
functions.showNewestJsonFromPrh(app, database);
