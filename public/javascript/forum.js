$(function () {
    function getPostClass() {
        var url = window.location.pathname == "/forum" ? "forum/getclass" : "getclass"
        $('#classResult').html('');
        $.ajax({
            type: 'POST',
            url: url,
            success: function (req) {
                $.each(req, function (index, item) {
                    appendClass(item.class_name_eng, item.class_name, index);
                })
                $('#myTab a').on('click', function (e) {
                    var classname = e.target.getAttribute("aria-controls");
                    e.preventDefault();
                    $(this).tab('show');
                    location.href = "/forum/" + classname;
                })
            }
        })
        function appendClass(class_eng, class_name, index) {
            if (window.location.pathname == "/forum" && index == 0) {
                $('#myTab').append(`
                <li class="nav-item">
                    <a class="nav-link active" id="${class_eng}-tab" data-toggle="tab" href="/forum/${class_eng}" role="tab" aria-controls="${class_eng}"
                        aria-selected="true">${class_name}</a>
                </li>`);
            } else if (window.location.pathname.indexOf(class_eng) > -1) {
                $('#myTab').append(`
                <li class="nav-item">
                    <a class="nav-link active" id="${class_eng}-tab" data-toggle="tab" href="/forum/${class_eng}" role="tab" aria-controls="${class_eng}"
                        aria-selected="true">${class_name}</a>
                </li>`);
            } else {
                $('#myTab').append(`
                <li class="nav-item">
                    <a class="nav-link" id="${class_eng}-tab" data-toggle="tab" href="/forum/${class_eng}" role="tab" aria-controls="${class_eng}"
                        aria-selected="false">${class_name}</a>
                </li>`);
            }
        }
    }

    function getPostList() {
        switch (window.location.pathname.split("/").length) {
            case 2:
                var url = "/forum/all/1";
                break;
            case 3:
                var url = window.location.pathname + "/1";
                break;
            case 4:
                var url = window.location.pathname;
                break;
        }
        $('#postResult').html('');
        $.ajax({
            type: 'GET',
            url: url + "/getpost",
            success: function (req) {
                $.each(req.postlist, function (index, item) {
                    var postd = new Date(item.latestReply_time_format);
                    var d = new Date();
                    var posttime = (d - postd) / 1000;
                    if (posttime < 60) {
                        item.latestReply_time_format = `1分內`;
                    } else if (posttime < (60 * 60)) {
                        item.latestReply_time_format = `${Math.floor(posttime / 60)}分前`;
                    } else if (posttime < (60 * 60 * 24)) {
                        item.latestReply_time_format = `${Math.floor(posttime / 60 / 60)}小時前`;
                    } else if (posttime >= (60 * 60 * 24)) {
                        item.latestReply_time_format = `${Math.floor(posttime / 60 / 60 / 24)}天前`;
                    }
                    appendPost(item.post_id, item.class_name, item.title, item.imageurl, item.content, item.reply, item.views, item.user, item.latestReply_user, item.latestReply_time_format);
                })
                $('.page').html('');
                var pattern = /\d+/;
                var classname = window.location.pathname.split("/").reverse()[1] != "" ? pattern.test(window.location.pathname.split("/").reverse()[0]) ? window.location.pathname.split("/").reverse()[1] : window.location.pathname.split("/").reverse()[0] : "all";
                for (let i = 1; i <= req.page; i++) {
                    if (url.split("/").reverse()[0] == i) {
                        $('.page').append(`<span>${i}</span>`)
                    } else {
                        $('.page').append(`<a href="/forum/${classname}/${i}"><span>${i}</span></a>`);
                    }
                }
            }
        })
        function appendPost(post_id, post_class, title, imageurl, content, reply, views, user, latestReply_user, latestReply_time) {
            var newTR = $('<div>');
            newTR.append(`<div><label>${post_class}</label></div>`);
            newTR.append(`<div><img src="${imageurl ? "/image/forum/upload/" + imageurl : "/image/forum/demo.png"}"></div>`);
            newTR.append(`<div><a href="/forum/post/${post_id}"><label>${title}</label></a>
                            <label>${content}</label></div>`);
            newTR.append(`<div>
                                <div><label>${user}</label></div>
                                <div class="views_reply_div">
                                    <div class="views"><i class="fa fa-eye" style="font-size:20px"></i><label>${views}</label></div>
                                    <div class="reply"><i class="fa fa-comments-o" style="font-size:20px"></i><label>${reply}</label></div>
                                </div>
                            </div>`);
            newTR.append(`<div><label>${latestReply_user}</label><label>${latestReply_time}</label></div>`);
            $('#postResult').append(newTR);
        }
    }
    getPostClass();
    getPostList();
    $('#search_submit').click(() => {
        if ($(".search input").val() != "") {
            sessionStorage.setItem('select_target', $('.search_select').val());
            sessionStorage.setItem('select_content', $('.search>input').val());
            location.href = "/forum/search"
        } else {
            $(".search input").focus();
        }
    })
})