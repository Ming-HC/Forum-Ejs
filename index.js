var express = require('express');
var app = express();
var session = require('express-session');
const bodyParser = require('body-parser');
app.use(express.json());
const connection = require('./routers/database');
var cors = require('cors');
const corsOptions = {
    origin: [ 'http://localhost:3000' ],
    credentials: true
};
app.use(cors( corsOptions ));


app.use(session({
    secret: 'any',
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        SameSite: "none",
        maxAge: 604800 * 1000       // 7 Days = 604800 Secs
    }
}))


app.set('view engine', 'ejs');
app.use(express.static('public'));

const forumRouter = require('./routers/forum');
app.use('/forum', forumRouter);
const memberRouter = require('./routers/member');
app.use('/member', memberRouter);

app.listen(3000, function () {
    console.log('Server Running.');
})

app.get('/', function (req, res) {
    res.redirect('/forum');
})

app.get('/navbar_headshot', function (req, res) {
    if (req.session.user) {
        var sql = `SELECT * FROM membercenter.personal WHERE username = ?`;
        connection.query(sql, [req.session.user.account], function (err, results, fields) {
            if (err) {
                console.log('select headshot error:', err);
                res.send("err");
            } else {
                res.send(results[0]);
            }
        })
    }
})