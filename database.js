// Connect to sql lite
const sqlite3 = require("sqlite3").verbose();

// Setting up the connection
const database = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if(err) return console.error(err.message);
    console.log("Database connection successful");
});

module.exports = database;

// CLOSE CONNECTION
// database.close((err) =>  {
//    if(err) return console.error(err.message);
// })

// CREATE DATABASE, needed only once
// database.run(
//    `CREATE TABLE companies (businessId, name, address, phone, website, updateDate)`
// );

// INSERT TO DATABASE
// const sql = `INSERT INTO companies (businessId, name, address, phone, website, updateDate)
//     VALUES (?, ?, ?, ?, ?, ?)`;
// database.run(sql, ['000','test','test', 'test', 'test', '2000-02-12'], (err) => {
//     if(err) return console.error(err.message);
//     console.log("New row has been created");
// });

// SELECT FROM DATABASE
// const sql = `SELECT * FROM companies`;
// database.all(sql, [], (err, rows) => {
//     if(err) return console.error(err.message);
//     rows.forEach(row => {
//         console.log(row);
//     });
// });

// UPDATE TO DATABASE
// const sql = `UPDATE table SET name = ?, address = ?, phone = ?, website = ?, updateDate = ?
//     WHERE businessId = '${businessId}'`;
// database.run(sql, ['test',' test', 'test', 'test', '2000-02-12'], (err) => {
//     if(err) return console.error(err.message);
// console.log("Row has been updated");
// });