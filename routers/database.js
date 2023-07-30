// 連線資料庫
var mysql = require('mysql');

var conn = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    multipleStatements: true
});

conn.connect(function (err) {
    if (err) throw err;
    console.log("DataBase Connected!");
})

module.exports = conn;