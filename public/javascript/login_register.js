$(function () {
    if (window.location.pathname.indexOf('login') > -1) {
        var url = 'login';
    } else if (window.location.pathname.indexOf('register') > -1) {
        var url = 'register';
    }
    function getform(url) {
        $('.formResult').html('');
        $.ajax({
            type: 'GET',
            url: url,
            success: function () {
                url = $('.formResult').prop('id');
                appendform(url);
            }
        })
        function appendform(url) {
            if (url == 'login') {
                var newFORM = `
                    <form class="row">
                        <div class="input_info">
                        <script src="https://accounts.google.com/gsi/client" async defer></script>
                            <div id="g_id_onload" data-client_id="579958787486-c73jlvvk6p4oja02bvbllvelq59alkip.apps.googleusercontent.com"
                                data-callback="onSignIn2"></div>
                            <div class="g_id_signin" data-type="standard"></div>
                            <div class="col-12">
                                <label for="uname" class="form-label"><b>使用者名稱：</b></label>
                                <input type="text" placeholder="Enter Username" id="uname" class="form-control" required>
                            </div>
                            <div class="col-12">
                                <label for="psw"><b>密碼：</b></label>
                                <input type="password" placeholder="Enter Password" id="psw" class="form-control" required>
                                <label></label>
                            </div>
                            <input type="submit" value="登入" />
                        </div>
                    </form>
                    <script>
                        function onSignIn2(response) {
                            var credential = response.credential,
                                profile = JSON.parse(decodeURIComponent(escape(window.atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))))); // 對 JWT 進行解碼

                            var dataToServer = {
                                nickname: profile.name,
                                headshot: profile.picture,
                                email: profile.email,
                                submitfrom: 'google',
                                thirdtoken: window.btoa(profile.sub)
                            }
                            $.ajax({
                                type: 'post',
                                url: 'thirdlogin/memberchk',
                                data: dataToServer,
                                success: (req) => {
                                    if (req.account) {
                                        $('#member').prop('href', '/member/'+req.account+'/personal');
                                        $('.imgcontainer img, #membericon img').prop('src', profile.picture);
                                        $('#psw+label').css('color', 'green');
                                        $('#psw+label').text('Login Success, 5秒後跳轉頁面.');
                                        if (document.referrer.indexOf('register') > -1) {
                                            if (req.logined_times < 1) {
                                                setTimeout(() => { location.href = '/member/'+req.account+'/personal'; }, 5000);
                                            } else {
                                                setTimeout(() => { location.href = '/'; }, 5000);
                                            }
                                        } else if (document.referrer == "" || document.referrer.indexOf('login') > -1) {
                                            if (req.logined_times < 1) {
                                                setTimeout(() => { location.href = '/member/'+req.account+'/personal'; }, 5000);
                                            } else {
                                                setTimeout(() => { location.href = '/'; }, 5000);
                                            }
                                        } else if (document.referrer.indexOf('/logout') > -1) {
                                            if (req.logined_times < 1) {
                                                setTimeout(() => { location.href = '/member/'+req.account+'/personal'; }, 5000);
                                            } else {
                                                setTimeout(() => { location.href = '/'; }, 5000);
                                            }
                                        } else {
                                            if (req.logined_times < 1) {
                                                setTimeout(() => { location.href = '/member/'+req.account+'/personal'; }, 5000);
                                            } else {
                                                setTimeout(() => { location.href = document.referrer; }, 5000);
                                            }
                                        }
                                    } else {
                                        $('#psw+label').css('color', 'red');
                                        $('#psw+label').text(req);
                                    }
                                }
                            })
                        }
                    </script>
            `;
            } else if (url == 'register') {
                var newFORM = `
                    <form action="/member/upload_headshot" method="post" enctype="multipart/form-data" class="row">
                        <div class="input_info">
                            <div>
                                <label><b>大頭貼：</b></label>
                                <input type="file" name="headshot" class="form-control">
                            </div>
                            <div>
                                <label><b>使用者名稱：</b></label>
                                <input type="text" placeholder="Enter Username" name="uname" class="form-control is-invalid" required>
                                <label>請輸入6-12個英數字</label><br>
                            </div>
                            <div>
                                <label><b>密碼：</b></label>
                                <input type="password" placeholder="Enter Password" name="psw" class="form-control is-invalid" required>
                                <label>請輸入6-12個英數字</label>
                            </div>
                            <input type="button" value="註冊" />
                        </div>
                    </form>
            `;
            } else if (url == 'logined') {
                alert('You are logined.');
                location.href = $(".d-none.d-md-block").prop("href").split("localhost")[1];
            }


            $('.formResult').append(newFORM);

            if (window.location.pathname.indexOf('register') > -1) {
                $('input[type=file]').change(function handleFiles() {
                    var img = document.querySelector('.imgcontainer img');
                    if ($('input[type=file]').val() != "") {
                        img.src = window.URL.createObjectURL(this.files[0]);
                        img.onload = function () {
                            window.URL.revokeObjectURL(this.src);
                        }
                    } else {
                        img.src = "/image/member/demo.png";
                    }
                })

                $('input[name=uname]').on('keyup', function () {
                    if ($('input[name=uname]').val() != "") {
                        var inputvalue = $('input[name=uname]').val();
                        var pattern = /^[A-Za-z0-9]{6,12}$/;
                        if (inputvalue.match(pattern)) {
                            $('input[name=uname]+label').text("");
                            $('input[name=uname]').prop('class', 'form-control is-valid');
                        } else {
                            $('input[name=uname]+label').css('color', 'red');
                            $('input[name=uname]+label').text("請輸入6-12個英數字");
                            $('input[name=uname]').prop('class', 'form-control is-invalid');
                        }
                    } else {
                        $('input[name=uname]').prop('class', 'form-control is-invalid');
                    }
                })
                $('input[name=uname]').on('focusout', function () {
                    if ($('input[name=uname]').val() != "" && $('input[name=uname]').prop('class').indexOf('is-valid') > -1) {
                        var dataToServer = {
                            username: $('input[name=uname]').val()
                        }
                        $.ajax({
                            type: 'post',
                            url: 'chkuser/memberchk',
                            data: dataToServer,
                            success: function (req) {
                                if (req.indexOf("can't") > -1) {
                                    $('input[name=uname]+label').css('color', 'red');
                                    $('input[name=uname]').prop('class', 'form-control is-invalid');
                                } else {
                                    $('input[name=uname]+label').css('color', 'green');
                                    $('input[name=uname]').prop('class', 'form-control is-valid');
                                }
                                $('input[name=uname]+label').text(req);
                            }
                        })
                    } else {
                        $('input[name=uname]').prop('class', 'form-control is-invalid');
                        $('input[name=uname]+label').text("請輸入6-12個英數字");
                    }
                })
                $('input[name=psw]').on('keyup', function () {
                    if ($('input[name=psw]').val() != "") {
                        var inputvalue = $('input[name=psw]').val();
                        var pattern = /^[A-Za-z0-9]{6,12}$/;
                        if (inputvalue.match(pattern)) {
                            $('input[name=psw]+label').text("");
                            $('input[name=psw]').prop('class', 'form-control is-valid');
                        } else {
                            $('input[name=psw]+label').css('color', 'red');
                            $('input[name=psw]+label').text("請輸入6-12個英數字");
                            $('input[name=psw]').prop('class', 'form-control is-invalid');
                        }
                    } else {
                        $('input[name=psw]').prop('class', 'form-control is-invalid');
                    }
                })
            }

            $('input[type=submit]').on('click', function (e) {
                if ($('#uname').val() && $('#psw').val()) {
                    if (url == 'login') {
                        e.preventDefault();
                        var dataToServer = {
                            username: $('#uname').val().toLowerCase(),
                            password: $('#psw').val()
                        }
                        $.ajax({
                            type: 'post',
                            url: url + '/memberchk',
                            data: dataToServer,
                            success: function (req) {
                                if (req.account) {
                                    req.headshot ? $('.imgcontainer img, #membericon img').prop('src', `/image/member/upload/headshot/${req.headshot}`) : null;
                                    $('#uname').prop('class', 'form-control is-valid');
                                    $('#psw').prop('class', 'form-control is-valid');
                                    $('#psw+label').css('color', 'green');
                                    $('#psw+label').text('Login Success, 5秒後跳轉頁面.');
                                    if (document.referrer.indexOf('register') > -1) {
                                        if (req.logined_times < 1) {
                                            setTimeout(() => { location.href = `/member/${req.account}/personal`; }, 5000);
                                        } else {
                                            setTimeout(() => { location.href = `/`; }, 5000);
                                        }
                                    } else if (document.referrer == "" || document.referrer.indexOf('login') > -1) {
                                        if (req.logined_times < 1) {
                                            setTimeout(() => { location.href = `/member/${req.account}/personal`; }, 5000);
                                        } else {
                                            setTimeout(() => { location.href = '/'; }, 5000);
                                        }
                                    } else if (document.referrer.indexOf('/logout') > -1) {
                                        if (req.logined_times < 1) {
                                            setTimeout(() => { location.href = `/member/${req.account}/personal`; }, 5000);
                                        } else {
                                            setTimeout(() => { location.href = '/'; }, 5000);
                                        }
                                    } else {
                                        setTimeout(() => { location.href = document.referrer; }, 5000);
                                    }
                                } else {
                                    $('#uname').prop('class', 'form-control is-invalid');
                                    $('#psw').prop('class', 'form-control is-invalid');
                                    $('#psw+label').css('color', 'red');
                                    $('#psw+label').text(req);
                                }
                            }
                        })
                    }
                } else {
                    $('#psw+label').text('請輸入使用者名稱及密碼');
                }
            })
            $('input[type=button]').click(() => {
                if (url == 'register' && $('input[name=uname]').prop('class').indexOf('is-valid') > -1 && $('input[name=psw]').prop('class').indexOf('is-valid') > -1) {
                    postheadshot();
                }
            })
            function postheadshot() {
                if ($("input[type=file]")[0].files.length && url == 'register') {
                    var data = new FormData();
                    $.each($("input[type=file]")[0].files, function (i, file) {
                        data.append('headshot', file);
                    })
                    $.ajax({
                        type: "post",
                        url: "/member/upload_headshot",
                        data: data,
                        contentType: false,
                        processData: false,
                        success: function (req) {
                            if (req.indexOf('\\') > -1) {
                                $('.imgcontainer img').prop('src', `/image/member/upload/headshot/${req.split('headshot\\')[1]}`);
                                postRegister(req.split('headshot\\')[1]);
                            } else {
                                $('.imgcontainer img').prop('src', `/image/member/upload/headshot/${req.split('headshot/')[1]}`);
                                postRegister(req.split('headshot/')[1]);
                            }
                        }
                    })
                } else if (url == 'register') {
                    postRegister();
                }
            }
            function postRegister(headshot) {
                if (url = 'register') {
                    $('input[name=psw]').val(window.btoa($('input[name=psw]').val()));
                    var dataToServer = {
                        username: $('input[name=uname]').val().toLowerCase(),
                        password: $('input[name=psw]').val(),
                        headshot: headshot
                    }
                    $.ajax({
                        type: 'post',
                        url: url + '/memberchk',
                        data: dataToServer,
                        success: function (req) {
                            if (req.indexOf('Success') > -1) {
                                $('input[name=psw]+label').text(req + ' 5秒後跳轉至登入頁.');
                                setTimeout(() => { location.href = 'login'; }, 5000);
                            } else {
                                $('input[name=psw]+label').text(req);
                            }
                        }
                    })
                }
            }
        }
    }
    getform(url);


    var login_signup_button = document.querySelectorAll('.header div');
    var login_signup_label = document.querySelectorAll('.header div label');
    if (url == 'login') {
        login_signup_button[0].style.borderBottom = '5px solid lightgray';
        login_signup_label[0].style.color = 'lightgray';
        login_signup_button[1].style.borderBottom = '5px solid coral';
        login_signup_label[1].style.color = 'black';
    } else if (url == 'register') {
        login_signup_button[0].style.borderBottom = '5px solid coral';
        login_signup_label[0].style.color = 'black';
        login_signup_button[1].style.borderBottom = '5px solid lightgray';
        login_signup_label[1].style.color = 'lightgray';
    }

    $('.header div').on('click', function () {
        if ($(this).find('label').text() == '登入') {
            var login_signup_pagechk = 'login';
            location.href = login_signup_pagechk;
        } else if ($(this).find('label').text() == '註冊') {
            var login_signup_pagechk = 'register';
            location.href = login_signup_pagechk;
        }
    })
})
