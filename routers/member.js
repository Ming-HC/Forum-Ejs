var express = require('express');
const router = express.Router();
const connection = require('./database');
var fs = require('fs');
var multer = require('multer');
var crypto = require('crypto');

router.get('/statechk', (req, res) => {
    if (req.session.user) {
        res.send(`/member/${req.session.user.account}/personal`);
    } else {
        res.send('/member/login');
    }
})

router.get('/:user/personal', function (req, res) {
    if (req.session.user) {
        res.render('member/personal', {
            page: 'personal',
            member: req.session.user.account + "/personal",
            url: 'logined'
        })
    } else {
        res.redirect('/member/login');
    }
})
router.get('/:user/personal/getdata', function (req, res) {
    var user = req.params.user;
    if(req.session.user) {
        var select_personal_sql = `SELECT * FROM membercenter.personal WHERE username = '${user}';`;
        connection.query(select_personal_sql, (err, results, fields) => {
            if (err) throw err;
            var dataToWeb = {
                username: results[0].username,
                nickname: results[0].nickname,
                email: results[0].mail,
                headshot: results[0].headshot,
                submitfrom: results[0].submitfrom,
                change_username_times: results[0].change_username_times
            }
            res.send(dataToWeb);
        })
    } else {
        res.redirect('/member/login');
    }
})

router.get('/:url(login|register)?', function (req, res) {
    if (req.session.user) {
        res.render('member/login_register', {
            page: 'login_register',
            member: req.session.user.account + "/personal",
            url: 'logined'
        })
    } else {
        if (req.params.url == 'login' || req.params.url == 'register') {
            res.render('member/login_register', {
                page: 'login_register',
                member: 'login',
                url: req.params.url
            })
        }
    }
})
router.post('/:url/memberchk', express.urlencoded(), function (req, res) {
    var url = req.params.url;
    var key = "mypasswordaeskey";
    var iv = key;
    var dataToWeb = {};
    if (url == 'login') {
        var sql = 'SELECT * FROM membercenter.personal where username = ?;';
        connection.query(sql, [req.body.username], function (err, results, fidlds) {
            if (err) {
                console.log('select username error: ' + JSON.stringify(err));
                res.send('username or password Input error.');
            } else {
                if (results[0]) {
                    if (req.body.username == results[0].username) {
                        var decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, "utf-8"), Buffer.from(iv, "utf-8"));
                        let decrypted = decipher.update(results[0].password, 'hex', 'utf8') + decipher.final('utf8');
                        if (req.body.password == decrypted) {
                            var d = new Date();
                            d.setHours(d.getHours() + 8);
                            req.session.user = {
                                'account': results[0].username,
                                'logined_at': d,
                            }
                            if (results[0].logined_times < 1) {
                                dataToWeb = {
                                    account: results[0].username,
                                    logined_times: results[0].logined_times,
                                    headshot: results[0].headshot
                                }
                            } else {
                                err
                                dataToWeb = {
                                    account: results[0].username,
                                    headshot: results[0].headshot
                                }
                            }
                            console.log('User: ' + results[0].username + ', logined_at: ' + d.toISOString().replace('T', ' ').substr(0, 19));
                            res.send(dataToWeb);
                            // 增加登入次數
                            var update_logined_times_sql = `UPDATE membercenter.personal set logined_times = ? where username = '${results[0].username}';`;
                            connection.query(update_logined_times_sql, [results[0].logined_times + 1], (err, results, fields) => {
                                if (err) throw err;
                            })
                        } else {
                            res.send('Username or Password Input error.');
                        }
                    }
                } else {
                    res.send('Username or Password Input error.');
                }
            }
        })
    } else if (url == 'register') {
        var sql = 'SELECT username FROM membercenter.personal where username = ?;';
        connection.query(sql, [req.body.username], function (err, results, fidlds) {
            if (err) {
                var replydata = 'select Username error';
                console.log(replydata + ': ' + JSON.stringify(err));
                res.send(replydata);
            } else {
                if (results[0]) {
                    if (req.body.username == results[0].username) {
                        res.send('Username already Register.');
                    }
                } else {
                    var decode = Buffer.from(req.body.password, 'base64').toString();
                    var encipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, "utf-8"), Buffer.from(iv, "utf-8"));
                    let encrypted = encipher.update(decode, 'utf8', 'hex') + encipher.final('hex');
                    sql = "INSERT INTO membercenter.personal (username, password, headshot) VALUES (?, ?, ?);";
                    connection.query(sql, [req.body.username, encrypted, req.body.headshot],
                        function (err, results, fidlds) {
                            if (err) {
                                replydata = 'INSERT DataBase error';
                                console.log(replydata + ': ' + JSON.stringify(err));
                                res.send(replydata);
                            } else {
                                res.send('Register Success.');
                            }
                        })
                }
            }
        })
    } else if (url == 'chkuser') {
        var sql = 'SELECT * FROM membercenter.personal where username = ?;';
        connection.query(sql, [req.body.username], function (err, results, fidlds) {
            if (err) {
                console.log('select Username error: ' + JSON.stringify(err));
                res.send('Username Input error.');
            } else {
                if (results[0]) {
                    if (req.body.username == results[0].username) {
                        res.send("Username can't use.");
                    } else {
                        res.send("Username can use.");
                    }
                } else {
                    res.send('Username can use.');
                }
            }
        })
    } else if (url == 'thirdlogin') {
        var decode = Buffer.from(req.body.thirdtoken, 'base64').toString();
        var encipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, "utf-8"), Buffer.from(iv, "utf-8"));
        let encrypted = encipher.update(decode, 'utf8', 'hex') + encipher.final('hex');
        var select_member_sql = `select * from membercenter.personal where thirdtoken = ?`;
        connection.query(select_member_sql, [encrypted], (err, results, fields) => {
            if (err) {
                console.log(err);
            } else {
                if (results[0]) {
                    if (encrypted == results[0].thirdtoken) {
                        var d = new Date();
                        d.setHours(d.getHours() + 8);
                        req.session.user = {
                            'account': results[0].username,
                            'logined_at': d,
                        }
                        if (results[0].logined_times < 1) {
                            dataToWeb = {
                                account: results[0].username,
                                logined_times: results[0].logined_times,
                                headshot: results[0].headshot
                            }
                        } else {
                            dataToWeb = {
                                account: results[0].username,
                                headshot: results[0].headshot
                            }
                        }
                        console.log('User: ' + results[0].username + ', logined_at: ' + d.toISOString().replace('T', ' ').substr(0, 19));
                        res.send(dataToWeb);
                        // 增加登入次數
                        var update_logined_times_sql = `UPDATE membercenter.personal set logined_times = ? where username = '${results[0].username}';`;
                        connection.query(update_logined_times_sql, [results[0].logined_times + 1], (err, results, fields) => {
                            if (err) throw err;
                        })
                    } else {
                        res.send('Google Login error.');
                    }
                } else {
                    // 未註冊過 > 註冊+登入
                    var select_userN_sql = `SELECT username from membercenter.personal;`;
                    connection.query(select_userN_sql, (err, results, fields) => {
                        if (err) {
                            console.log("select username err:", err);
                        } else {
                            const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
                            var randomuser = "";
                            randomuserF();
                            function randomuserF() {
                                var randomstr = [];
                                for (let i = 0; i < 12; i++) {
                                    var randomindex = Math.floor(Math.random() * 36);
                                    randomstr.push(characters.charAt(randomindex));
                                }
                                randomuser = randomstr.join("");
                                chkuser();
                            }
                            function chkuser() {
                                for (let i = 0; i < results.length; i++) {
                                    if (randomuser == results[i].username) {
                                        randomuserF();
                                        break;
                                    }
                                }
                            }
                            var third_register_member_sql = `INSERT INTO membercenter.personal (username, nickname, headshot, mail, submitfrom, thirdtoken) VALUES (?, ?, ?, ?, ?, ?);`;
                            var third_login_member_sql = `SELECT * FROM membercenter.personal WHERE thirdtoken = ?`;
                            connection.query(third_register_member_sql + third_login_member_sql, [randomuser, req.body.nickname, req.body.headshot, req.body.email, req.body.submitfrom, encrypted, encrypted], (err, results, fields) => {
                                if (err) {
                                    console.log("submit third member err:", err);
                                } else {
                                    if (results[1]) {
                                        if (encrypted == results[1][0].thirdtoken) {
                                            var d = new Date();
                                            d.setHours(d.getHours() + 8);
                                            req.session.user = {
                                                'account': results[1][0].username,
                                                'logined_at': d
                                            }
                                            if (results[1][0].logined_times < 1) {
                                                dataToWeb = {
                                                    account: results[1][0].username,
                                                    logined_times: results[1][0].logined_times,
                                                    headshot: results[1][0].headshot
                                                }
                                            } else {
                                                dataToWeb = {
                                                    account: results[1][0].username,
                                                    headshot: results[1][0].headshot
                                                }
                                            }
                                            console.log('User: ' + results[1][0].username + ', logined_at: ' + d.toISOString().replace('T', ' ').substr(0, 19));
                                            res.send(dataToWeb);
                                            // 增加登入次數
                                            var update_logined_times_sql = `UPDATE membercenter.personal set logined_times = ? where username = '${results[1][0].username}';`;
                                            connection.query(update_logined_times_sql, [results[1][0].logined_times + 1], (err, results, fields) => {
                                                if (err) throw err;
                                            })
                                        } else {
                                            res.send('Google Login error.');
                                        }
                                    } else {
                                        console.log('third member select err:', err);
                                        res.send('Google Login error.');
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })
    }
})
var y = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/image/member/upload/headshot");
    },
    filename: async function (req, file, cb) {
        fs.readdir('public/image/member/upload/headshot', function (err, data) {
            if (err) throw err;
            if (data[0]) {
                data.forEach(function (filename, index) {
                    data[index] = filename.split('.png')[0].split('_')[1];
                })
                data = data.sort(function (a, b) { return a - b });
                var userFileName = `headshot_${Number(data[data.length - 1]) + 1}.png`;
            } else {
                var userFileName = `headshot_0.png`;
            }
            cb(null, userFileName);
        })
    }
})
var x = multer({
    storage: y,
    fileFilter: function (req, file, cb) {
        if (file.mimetype != 'image/png') {
            return cb(new Error('檔案類型錯誤123'))
        }
        cb(null, true);
    }
});
router.post('/upload_headshot', x.single('headshot'), function (req, res) {
    res.send(req.file.path);
})

router.put('/:user/update', express.urlencoded(), (req, res) => {
    var username = req.params.user;
    var chksubmitfrom_sql = `SELECT * FROM membercenter.personal WHERE username = '${username}';`;
    connection.query(chksubmitfrom_sql, (err, results, fields) => {
        if (err) throw err;
        if (results[0].submitfrom == 'google' && results[0].change_username_times == 0) {
            var update_username_sql = `UPDATE membercenter.personal SET username = ?, change_username_times = '1' WHERE username = '${username}';`;
            connection.query(update_username_sql, [req.body.username], (err, results, fields) => {
                if (err) throw err;
                req.session.user.account = req.body.username;
                res.send(`update username success, new username is ${req.body.username}`);
            })
        }
    })
})
router.put('/:user/logout', (req, res) => {
    delete req.session.user;
    // req.session.user = null;
    res.send('logout success.');
})

module.exports = router;