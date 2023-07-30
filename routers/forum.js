var express = require('express');
const router = express.Router();
const connection = require('./database');
var fs = require('fs');
var multer = require('multer');

router.get('/:class(all|complex|gossip|ask|system|delete)?/:page(\\d+)?', function (req, res) {
    var targetpage = req.params.page ? req.params.page : 1;
    var sql = `SELECT * FROM forum.postlist where post_exists = 1;`;
    connection.query(sql, function (err, results, fields) {
        if (err) {
            console.log("select forum.postlist err:", err);
        } else {
            if (targetpage > 0 && targetpage <= Math.ceil(results.length / 20) || results.length == 0) {
                if (req.session.user) {
                    res.render('forum/forum', {
                        page: 'forum',
                        member: req.session.user.account + '/personal/'
                    });
                } else {
                    res.render('forum/forum', {
                        page: 'forum',
                        member: 'login'
                    });
                }
            } else {
                res.send("404 error");
            }
        }
    })
})

router.get('/view/newpost', function (req, res) {
    if (req.session.user) {
        res.render('forum/newpost', {
            page: 'newpost',
            member: req.session.user.account + '/personal/'
        });
    } else {
        res.redirect('/member/login');
    }
})


router.get('(/:class)?/:page/getpost', function (req, res) {
    var targetpage = req.params.page;
    var classname = req.params.class ? req.params.class : "all";
    var select_classname_sql = `select class_name from forum.class where class_name_eng = '${classname}';`;
    connection.query(select_classname_sql, function (err, results, fields) {
        if (err) {
            console.log("select class name error:", err);
        } else {
            var targetclass = results[0].class_name == "全部主題" ? null : results[0].class_name;
            var exists = targetclass == "回收區" ? 1 : 0;
            var get_limitpost_sql = `select * , DATE_FORMAT(latestReply_time, '%Y/%m/%d %H:%i') latestReply_time_format FROM forum.postlist ${targetclass ? "where class_name = " + "'" + targetclass + "' and post_exists = " + !exists + " " : "where class_name != '回收區' and post_exists = " + !exists + " "}ORDER BY latestReply_time DESC LIMIT ${(targetpage - 1) * 20}, 20;`;
            var get_allpost_sql = `select * FROM forum.postlist${targetclass ? " where class_name = " + "'" + targetclass + "' and post_exists = " + !exists : " where class_name != '回收區' and post_exists = " + !exists};`;
            connection.query(get_limitpost_sql + get_allpost_sql,
                function (err, results, fields) {
                    if (err) {
                        res.send('select error', err);
                    } else {
                        if (!exists) {
                            var dataToWeb = {
                                postlist: results[0],
                                page: Math.ceil(results[1].length / 20)
                            }
                            res.json(dataToWeb);
                        } else {
                            for (let i = 0; i < results[0].length; i++) {
                                results[0][i].title = "首篇已刪";
                                results[0][i].imageurl = "";
                                results[0][i].content = `此文章已由原作者(${results[0][i].user})刪除。`;
                            }
                            var dataToWeb = {
                                postlist: results[0],
                                page: Math.ceil(results[1].length / 20)
                            }
                            res.json(dataToWeb);
                        }

                    }
                })
        }
    })

})

router.get('/editpost/:id/:floor', function (req, res) {
    if (req.session.user) {
        res.render('forum/editpost', {
            page: 'editpost',
            member: req.session.user.account + '/personal/'
        });
    } else {
        res.redirect('/member/login');
    }
})
router.get('/editpost/:id/:floor/getdata', function (req, res) {
    if (req.session.user) {
        var post_id = req.params.id;
        var floor = req.params.floor;
        var sql = `SELECT * FROM forum.post_${post_id} where reply_floor ${floor == 1 ? "= " + floor + ";" : "in (1, " + floor + ");"}`;
        connection.query(sql, function (err, results, fields) {
            if (err) {
                console.log("select postid err", err);
                res.send("select post error");
            } else {
                res.json(results);
            }
        })
    } else {
        res.redirect('/member/login');
    }
})
let upload_image_index = 0;
var post_upload_img = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/image/forum/upload");
    },
    filename: async function (req, file, cb) {
        fs.readdir('public/image/forum/upload', function (err, data) {
            if (err) throw err;
            upload_image_index++;
            if (data[0]) {
                data.forEach(function (filename, index) {
                    data[index] = filename.split('.png')[0].split('_')[1];
                })
                data = data.sort(function (a, b) { return a - b });
                var userFileName = `img_${Number(data[data.length - 1]) + upload_image_index}.png`;
            } else {
                var userFileName = `img_0.png`;
            }
            cb(null, userFileName);
        })
    }
})
var post_upload = multer({
    storage: post_upload_img,
    fileFilter: function (req, file, cb) {
        if (file.mimetype != 'image/png') {
            return cb(new Error('檔案類型錯誤123'))
        }
        cb(null, true);
    }
});

router.post('/editpost/:id/:floor/edit', express.urlencoded(), post_upload.array('imageurl'), function (req, res) {
    upload_image_index = 0;
    var post_id = req.params.id;
    var floor = req.params.floor;
    if (req.body.content.length > 50) {
        var postlist_content = req.body.content.slice(0, 50);
    } else {
        var postlist_content = req.body.content;
    }
    var imageurl = [];
    if (req.body.oldimageurl) {
        var original = req.body.oldimageurl.split(',');
        for (let i = 0; i < original.length; i++) {
            imageurl.push(original[i]);
        }
    }
    for (let i = 0; i < req.files.length; i++) {
        if (req.files[0].path.indexOf('\\') > -1) {
            imageurl.push(req.files[i].path.split('upload\\')[1]);
        } else {
            imageurl.push(req.files[i].path.split('upload/')[1]);
        }
    }
    switch (req.body.class_name) {
        case 'complex':
            req.body.class_name = '綜合討論';
            break;
        case 'gossip':
            req.body.class_name = '閒聊';
            break;
        case 'ask':
            req.body.class_name = '新手發問';
            break;
        case 'system':
            req.body.class_name = '系統公告';
            break;
    }
    if (req.session.user) {
        if (floor == 1) {
            var update_post_sql = `update forum.post_${post_id} set class_name = ?, title = ?, imageurl = ?, content = ? where reply_floor = ${floor};`;
            var update_postlist_sql = `update forum.postlist set class_name = ?, title = ?, imageurl = ?, content = ? where post_id = ${post_id};`
            connection.query(update_post_sql + update_postlist_sql, [req.body.class_name, req.body.title, imageurl.join(), req.body.content, req.body.class_name, req.body.title, imageurl[0], postlist_content], function (err, results, fields) {
                if (err) {
                    console.log("update post error:", err);
                    res.send("update post error");
                } else {
                    res.redirect(`/forum/post/${post_id}`);
                }
            })
        } else {
            var update_post_sql = `update forum.post_${post_id} set imageurl = ?, content = ? where reply_floor = ${floor};`;
            var update_postlist_sql = `update forum.postlist set imageurl = ?, content = ? where post_id = ${post_id};`
            connection.query(update_post_sql + update_postlist_sql, [imageurl.join(), req.body.content, imageurl[0], postlist_content], function (err, results, fields) {
                if (err) {
                    console.log("update post error:", err);
                    res.send("update post error");
                } else {
                    res.redirect(`/forum/post/${post_id}`);
                }
            })
        }

    } else {
        res.redirect('/member/login');
    }
})
router.post('(/:class)?/getclass', express.urlencoded(), function (req, res) {
    var sql = "select class_name_eng, class_name FROM forum.class;";
    if (req.body.from) {
        connection.query(sql,
            function (err, results, fields) {
                if (err) {
                    res.send('select error', err);
                } else {
                    if (req.session.user.account == 'root') {
                        var limitclass = [];
                        for (let i = 1; i <= 4; i++) {
                            limitclass.push(results[i]);
                        }
                        res.json({ results: limitclass, logined_user: req.session.user.account });
                    } else {
                        var limitclass = [];
                        for (let i = 1; i <= 3; i++) {
                            limitclass.push(results[i]);
                        }
                        res.json({ results: limitclass, logined_user: req.session.user.account });
                    }
                }
            })
    } else {
        connection.query(sql,
            function (err, results, fields) {
                if (err) {
                    res.send('select error', err);
                } else {
                    res.json(results);
                }
            })
    }
})

router.post('/newpost/:something', express.urlencoded(), post_upload.array('imageurl'), function (req, res) {
    upload_image_index = 0;
    var imageurl = [];
    for (let i = 0; i < req.files.length; i++) {
        if (req.files[0].path.indexOf('\\') > -1) {
            imageurl.push(req.files[i].path.split('upload\\')[1]);
        } else {
            imageurl.push(req.files[i].path.split('upload/')[1]);
        }
    }
    switch (req.body.class_name) {
        case 'complex':
            req.body.class_name = '綜合討論';
            break;
        case 'gossip':
            req.body.class_name = '閒聊';
            break;
        case 'ask':
            req.body.class_name = '新手發問';
            break;
        case 'system':
            req.body.class_name = '系統公告';
            break;
    }
    if (req.session.user) {
        if (req.params.something == 'new') {
            if (req.body.content.length > 70) {
                var postlist_content = req.body.content.slice(0, 70);
            } else {
                var postlist_content = req.body.content;
            }
            var create_postlist_sql = `insert into forum.postlist(class_name, title, imageurl, content, user, latestReply_user) values (?, ?, ?, ?, ?, ?);`;
            var checkdata = {
                flag: false,
                post_id: ""
            };
            connection.query(create_postlist_sql,
                [req.body.class_name, req.body.title, imageurl[0], postlist_content, req.session.user.account, req.session.user.account],
                function (err, results, fields) {
                    if (err) {
                        res.send('create postlist error', err);
                    } else {
                        checkdata.flag = true;
                        checkdata.post_id = results.insertId
                        if (checkdata.flag) {
                            var create_post_sql = `
                        create table forum.post_${checkdata.post_id} (
                            reply_floor int not null AUTO_INCREMENT,
                            class_name varchar(20) default null,
                            title varchar(40) default null,
                            user varchar(20) not null,
                            imageurl varchar(200) default null,
                            content varchar(1000) not null,
                            post_time timestamp default now(),
                            floor_exists int default 1,
                            primary key (reply_floor),
                            foreign key (class_name) references class(class_name)
                            );
                        `;
                            var select_headshot_sql = `SELECT * FROM membercenter.personal WHERE username = ?;`;
                            connection.query(create_post_sql + select_headshot_sql, [req.session.user.account], function (err, results, fields) {
                                if (err) {
                                    console.log('select error', err);
                                    res.send('select error', err);
                                } else {
                                    imageurl = imageurl.join();
                                    var insert_post_sql = `INSERT INTO forum.post_${checkdata.post_id} (class_name, title, imageurl, content, user) values (?, ?, ?, ?, ?);`
                                    connection.query(insert_post_sql, [req.body.class_name, req.body.title, imageurl, req.body.content, req.session.user.account],
                                        function (err, results, fields) {
                                            if (err) {
                                                console.log('insert into error:', err);
                                                res.send('insert into error:', err);
                                            } else {
                                                res.redirect('/forum');
                                            }
                                        })
                                }
                            })
                        } else {
                            res.send('insert postlist done, but create post table wrong.');
                        }
                    }
                }
            )
        }
    } else {
        res.redirect('/member/login');
    }
})

router.get('/post/:id', function (req, res) {
    if (req.session.user) {
        res.render('forum/post', {
            page: 'post',
            member: req.session.user.account + '/personal/'
        });
    } else {
        res.render('forum/post', {
            page: 'post',
            member: 'login'
        });
    }
})

router.get('/post/:id/getdata', function (req, res) {
    var post_id = req.params.id;
    var sql = `SELECT *, DATE_FORMAT(post_time, '%Y/%m/%d %H:%i') post_time_format FROM forum.post_${post_id}`;
    connection.query(sql, function (err, results, fields) {
        if (err) {
            console.log('Get Post page error:', err);
            res.send('select err', err);
        } else {
            for (let i = 0; i < results.length; i++) {
                if (!results[i].floor_exists) {
                    if (i == 0) {
                        results[i].title = "首篇已刪";
                        results[i].content = `此文章已由原作者(${results[i].user})刪除。`;
                    } else {
                        results[i].content = `此回覆已由原作者(${results[i].user})刪除。`;
                    }
                }
            }
            var selecttarget = [];
            for (let i = 0; i < results.length; i++) {
                selecttarget.push(results[i].user);
            }
            var select_member_headshot_sql = `SELECT username, headshot FROM membercenter.personal WHERE username in (?);`;
            connection.query(select_member_headshot_sql, [selecttarget], (err, results_headshot, fields) => {
                if (err) {
                    console.log("select member headshot err:", err);
                } else {
                    for (let i = 0; i < results.length; i++) {
                        for (let o = 0; o < results_headshot.length; o++) {
                            if (results[i].user == results_headshot[o].username) {
                                results[i].headshot = results_headshot[o].headshot;
                                break;
                            }
                        }
                    }
                    res.json(results);
                }
            })

            // 增加瀏覽數
            var select_post_views_sql = `SELECT views FROM forum.postlist where post_id = ${post_id};`;
            connection.query(select_post_views_sql, function (err, results, fields) {
                if (err) {
                    console.log("select_post_views error:", err);
                } else {
                    var add_post_views_sql = `UPDATE forum.postlist set views = ? where post_id = ${post_id};`;
                    // var oldviews = results[0].views;
                    connection.query(add_post_views_sql, [results[0].views + 1], function (err, results, fields) {
                        if (err) {
                            console.log("update post views error", err);
                        } else {
                            // console.log(`UPDATE post_${post_id} views = ${oldviews+1} now.`)
                        }
                    })
                }
            })

        }
    })
})
router.post('/post/:id/reply', express.urlencoded(), post_upload.array('imageurl'), function (req, res) {
    upload_image_index = 0;
    if (req.session.user) {
        var imageurl = [];
        for (let i = 0; i < req.files.length; i++) {
            if (req.files[0].path.indexOf('\\') > -1) {
                imageurl.push(req.files[i].path.split('upload\\')[1]);
            } else {
                imageurl.push(req.files[i].path.split('upload/')[1]);
            }
        }
        var post_id = req.params.id;
        imageurl = imageurl.join();
        var sql = `INSERT INTO forum.post_${post_id}(user, imageurl, content) values(?, ?, ?);`;
        connection.query(sql, [req.session.user.account, imageurl, req.body.content], function (err, results, fields) {
            if (err) {
                console.log("reply post error", err);
                res.send("reply post error");
            } else {
                var select_latestreply_sql = `select user, post_time from forum.post_${post_id} ORDER BY post_time desc;`;
                connection.query(select_latestreply_sql, function (err, results, fields) {
                    if (err) {
                        console.log("search latestreply err:", err);
                        res.send("search latestreply error");
                    } else {
                        var update_latestreply_sql = `update forum.postlist set reply = ?, latestReply_user = ?, latestReply_time  = ? where post_id = ${post_id};`;
                        connection.query(update_latestreply_sql, [results.length - 1, results[0].user, results[0].post_time], function (err, results, fields) {
                            if (err) {
                                console.log("update_latestreply err:", err);
                                res.send("update_latestreply err");
                            } else {
                                // res.send("reply post success.");
                                res.redirect(`/forum/post/${post_id}`);
                            }
                        })
                    }
                })
            }
        })
    } else {
        res.redirect('/member/login');
    }
})

router.put('/deletepost/:id/:floor', function (req, res) {
    var post_id = req.params.id;
    var floor = req.params.floor;
    if (req.session.user) {
        var delete_reply_sql = `UPDATE forum.post_${post_id} set floor_exists = 0 where reply_floor = ${floor};`;
        if (floor != 1) {
            connection.query(delete_reply_sql, (err, results, fields) => {
                if (err) {
                    console.log("update floor exists error:", err);
                } else {
                    res.send("delete success.");
                }
            })
        } else if (floor == 1) {
            connection.query(delete_reply_sql, (err, results, fields) => {
                if (err) {
                    console.log("update floor_1 exists error:", err);
                } else {
                    var delete_post_sql = `UPDATE forum.postlist set post_exists = 0, class_name = '回收區' where post_id = ${post_id};`;
                    connection.query(delete_post_sql, (err, results, fields) => {
                        if (err) {
                            console.log("update exists and class of postlist error:", err);
                        } else {
                            res.send("delete success");
                        }
                    })
                }
            })
        }
    } else {
        res.send("you are not login.");
    }
})

router.get('/search(/:page)?', (req, res) => {
    if (req.session.user) {
        res.render('forum/searchpost', {
            page: 'searchpost',
            member: req.session.user.account + '/personal/'
        });
    } else {
        res.render('forum/searchpost', {
            page: 'searchpost',
            member: 'login'
        });
    }
})

router.post('/search(/:page)?', express.urlencoded(), (req, res) => {
    var targetpage = req.params.page ? req.params.page : 1;
    switch (req.body.select_target) {
        case "all":
            var search_sql = `SELECT *, DATE_FORMAT(latestReply_time, '%Y/%m/%d %H:%i') latestReply_time_format from forum.postlist where post_exists = 1 and (title like '%${req.body.select_content}%' or content like '%${req.body.select_content}%' or user like '%${req.body.select_content}%') ORDER BY latestReply_time DESC LIMIT ${(targetpage - 1) * 20}, 20;`;
            var search_page_sql = `SELECT * from forum.postlist where post_exists = 1 and (title like '%${req.body.select_content}%' or content like '%${req.body.select_content}%' or user like '%${req.body.select_content}%');`;
            connection.query(search_sql + search_page_sql, (err, results, fields) => {
                if (err) {
                    console.log("search err:", err);
                } else {
                    var dataToWeb = {
                        postlist: results[0],
                        page: Math.ceil(results[1].length / 20),
                        reslength: results[1].length
                    }
                    res.json(dataToWeb);
                }
            })
            break;
        case "title":
            var search_sql = `SELECT *, DATE_FORMAT(latestReply_time, '%Y/%m/%d %H:%i') latestReply_time_format from forum.postlist where post_exists = 1 and title like '%${req.body.select_content}%' ORDER BY latestReply_time DESC LIMIT 0, 20;`;
            var search_page_sql = `SELECT * from forum.postlist where post_exists = 1 and title like '%${req.body.select_content}%';`;
            connection.query(search_sql + search_page_sql, (err, results, fields) => {
                if (err) {
                    console.log("search err:", err);
                } else {
                    var dataToWeb = {
                        postlist: results[0],
                        page: Math.ceil(results[1].length / 20),
                        reslength: results[1].length
                    }
                    res.send(dataToWeb);
                }
            })
            break;
        case "content":
            var dataToWeb = { post_id: [] };
            var search_allpostid_sql = `SELECT post_id FROM forum.postlist WHERE post_exists = 1;`;
            connection.query(search_allpostid_sql, (err, results, fields) => {
                if (err) {
                    console.log("search postid err:", err);
                } else {
                    const promises = results.map((result) => {
                        const search_content_sql = `SELECT reply_floor FROM forum.post_${result.post_id} WHERE floor_exists = 1 and content like '%${req.body.select_content}%';`;
                        return new Promise((resolve, reject) => {
                            connection.query(search_content_sql, (err, results2, fields) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(results2[0] ? result.post_id : "");
                                }
                            })
                        })
                    })
                    Promise.all(promises).then((results2) => {
                        var search_res = [];
                        results2.forEach((item) => {
                            item != "" ? search_res.push(item) : null;
                        })
                        if (search_res.length) {
                            targetpage = Math.ceil(search_res.length / 20);
                            var seach_res_sql = `SELECT *, DATE_FORMAT(latestReply_time, '%Y/%m/%d %H:%i') latestReply_time_format FROM forum.postlist WHERE post_exists = 1 and post_id in (?) ORDER BY latestReply_time DESC LIMIT ${targetpage - 1}, 20;`;
                            connection.query(seach_res_sql, [search_res], (err, results, fields) => {
                                if (err) {
                                    console.log("search result err:", err);
                                } else {
                                    dataToWeb = {
                                        postlist: results,
                                        page: targetpage,
                                        reslength: search_res.length
                                    }
                                    res.send(dataToWeb);
                                }
                            })
                        } else {
                            dataToWeb = {
                                postlist: [],
                                page: 1,
                                reslength: 0
                            }
                            res.send(dataToWeb);
                        }
                    }).catch((err) => {
                        console.error(err);
                    });
                }
            })
            break;
    }
})
router.get('/get_randompost', (req, res) => {
    var sql = `SELECT * FROM forum.postlist WHERE post_exists = 1;`;
    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        if (results.length >= 12) {
            var dataToWeb = [];
            var randomindex = 0;
            var flag = 1;
            while (dataToWeb.length < 12) {
                randomindex = Math.floor(Math.random() * results.length);
                if (dataToWeb.length != 0) {
                    flag = 1;
                    for (let i = 0; i < dataToWeb.length; i++) {
                        if (results[randomindex].post_id == dataToWeb[i].post_id) {
                            flag = 0;
                            break;
                        }
                    }
                    if (flag == 1) {
                        dataToWeb.push(results[randomindex]);
                    }
                } else {
                    dataToWeb.push(results[randomindex]);
                }
            }
            res.send(dataToWeb);
        } else {
            res.send(results);
        }
    })
})

module.exports = router;