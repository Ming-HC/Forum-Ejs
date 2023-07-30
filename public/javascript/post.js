$(function () {
    $('.page').remove();
    function getfloor() {
        $('#floorResult').html('');
        $.ajax({
            type: 'GET',
            url: window.location.pathname + '/getdata',
            success: function (req) {
                $.each(req, function (index, item) {
                    appendFloor(item.floor_exists, item.headshot, item.user, item.class_name, item.title, item.reply_floor, item.post_time_format, item.content, item.imageurl);
                })
            }
        })
        function appendFloor(exists, headshot, user, class_name, title, reply_floor, post_time, content, imageurl) {
            if (exists) {
                if (headshot) {
                    if (headshot.indexOf("headshot") > -1) {
                        headshot = `/image/member/upload/headshot/${headshot}`
                    }
                } else {
                    headshot = "/image/member/demo.png"
                }
                var newFloor = `
            <div class="reply_floor floor_${reply_floor}">
                <div>
                    <div class="col-12" id="title">
                            <!-- title -->
                            <label>${class_name ? class_name : ""}</label>
                            <h3>${title ? title : ""}</h3>
                        </div>
                    <div class="col-4" id="user_info">
                        <!-- headphoto username -->
                        <div><img src="${headshot}" /></div>
                        <div><a href=""><label>${user}</label></a></div>
                    </div>
                    <div class="col-7">
                        <div>
                            <div>
                                <!-- content -->
                                <div id="reply_floor_div"><label>${reply_floor}F</label></div>
                                <div>
                                    ${appendimage(imageurl)}
                                    <pre>${content}</pre>
                                    <label>${post_time}</label>
                                </div>
                            </div>
                            <div class="function_div">
                                <!-- function button ex. like reply message -->
                                ${$("#membericon").prop('href').indexOf('login') == -1 ?
                        user == $("#membericon").prop('href').split('/')[4] ? '<input type="button" class="edit" value="編輯"/>' : "" : ""
                    }
                                ${$("#membericon").prop('href').indexOf('login') == -1 ?
                        user == $("#membericon").prop('href').split('/')[4] ? '<input type="button" class="delete" value="刪除"/>' : "" : ""
                    }
                                <input type="button" class="reply" value="回覆" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
                function appendimage(imageurl) {
                    if (imageurl) {
                        var imageres = [];
                        imageres = imageurl.split(',');
                        for (let i = 0; i < imageres.length; i++) {
                            imageres[i] = `<img src="/image/forum/upload/${imageres[i]}"/>`;
                        }
                        return imageres.join().replaceAll(',', '');
                    } else {
                        return '';
                    }
                }
                $('#floorResult').append(newFloor);

                $(`.floor_${reply_floor} .edit`).click((e) => {
                    var post_id = window.location.pathname.split("post/")[1];
                    // console.log(e.target.parentNode.parentNode.querySelector("#reply_floor_div label"));
                    var floor = e.target.parentNode.parentNode.querySelector("#reply_floor_div label").innerText.split("F")[0];
                    location.href = `/forum/editpost/${post_id}/${floor}`;

                })
                $(`.floor_${reply_floor} .reply`).click(() => {
                    if ($("#member").prop("href").indexOf('login') > -1) {
                        var hint = "需登入才可回覆，是否登入？"
                        if (confirm(hint) == true) {
                            location.href = "/member/login";
                        }
                    } else {
                        $("textarea").focus();
                    }
                })
                $(`.floor_${reply_floor} .delete`).click((e) => {
                    var post_id = window.location.pathname.split("post/")[1];
                    var floor = e.target.parentNode.parentNode.querySelector("#reply_floor_div label").innerText.split("F")[0];
                    var hint = "是否確定刪除文章";
                    if (confirm(hint) == true) {
                        $.ajax({
                            type: "PUT",
                            url: `/forum/deletepost/${post_id}/${floor}`,
                            success: (req) => {
                                if (req.indexOf("success") > -1) {
                                    if (floor == 1) {
                                        location.href = "/forum";
                                    } else {
                                        window.location.reload();
                                    }
                                }
                            }
                        })
                    }
                })
            } else {
                if (reply_floor == 1) {
                    var unexists_floor = `
                    <div class="col-12 d_title" id="title">
                            <!-- title -->
                            <label>${class_name ? class_name : ""}</label>
                            <h3>${title ? title : ""}</h3>
                        </div>
                    <div class="reply_floor floor_${reply_floor} d_floor">
                        <label>此文章已由原作者(${user})刪除</label>
                        <div id="reply_floor_div"><label>${reply_floor}F</label></div>
                    </div>
                    `;
                    $('#floorResult').append(unexists_floor);
                } else {
                    var unexists_floor = `
                    <div class="reply_floor floor_${reply_floor} d_floor">
                        <label>此回覆已由原作者(${user})刪除</label>
                        <div id="reply_floor_div"><label>${reply_floor}F</label></div>
                    </div>
                    `;
                    $('#floorResult').append(unexists_floor);
                }
            }
        }
    }
    getfloor();
    $("textarea, input[type=file]").focus(() => {
        if ($("#member").prop("href").indexOf('login') > -1) {
            var hint = "需登入才可回覆，是否登入？"
            if (confirm(hint) == true) {
                $("textarea, input[type=file]").blur();
                location.href = "/member/login";
            } else {
                $("textarea, input[type=file]").blur();
            }
        }
    });
    $('.reply_form').prop('action', window.location.pathname + "/reply");
})
function handleFiles(e) {
    if (e.value != "") {
        $('.img_group .img_block img').eq($('.img_group .img_block img').length - 1).prop("src", window.URL.createObjectURL(e.files[0]));
        $('.img_group .img_block img').eq($('.img_group .img_block img').length - 1).onload = function () {
            window.URL.revokeObjectURL(e.src);
        }
        e.style.display = "none";
        $('.img_group .img_block .img_tip').eq($('.img_group .img_block .img_tip').length - 1).text(e.value.split("\\").reverse()[0]);
        $('.inputfile_group').append(`<input type="file" name="imageurl" accept="image/*" onchange=handleFiles(this)>`);
        $('.img_group').append(`<div class="img_block"><img src="/image/forum/upload_image_demo.png"><div class="img_tip" onmouseenter=hoverimg(this) onmouseleave=leaveimg(this) onclick=delimg(this)></div></div>`);
    }
}
var flag = 1;
function hoverimg(e) {
    if (e.value != '點擊刪除' && flag) {
        e.value = e.innerText;
        flag = !flag;
    }
    e.style.opacity = 0.9;
    e.innerText = "點擊刪除";
    e.style.color = "red";
}
function leaveimg(e) {
    e.innerText = e.value;
    e.style.opacity = 0.7;
    e.style.color = "white";
    flag = !flag;
}
function delimg(e) {
    $(e.parentNode).remove();
    for (let i = 0; i < $('input[type=file]').length; i++) {
        if ($('input[type=file]').eq(i).val().indexOf(`${e.value}`) > -1) {
            $('input[type=file]').eq(i).remove();
            break;
        }
    }
    flag = 1;
}
