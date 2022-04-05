// Loading the Express-module
const express = require('express');
const app = express();
const port = 8000;

// Listening the port
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

// Exports to outside of the module
module.exports = app;