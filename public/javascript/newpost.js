$(function () {
    var member = {
        username: ''
    }
    function getPostClass() {
        $('#classResult').html('');
        $.ajax({
            type: 'POST',
            url: '/forum/getclass',
            data: { from: 'newpost' },
            success: function (req) {
                $.each(req.results, function (index, item) {
                    appendClass(item.class_name_eng, item.class_name);
                })
                member.username = req.logined_user;
            }
        })
        function appendClass(class_eng, class_name) {
            $('#classResult').append(`
                <option value="${class_eng}">${class_name}</option>
            `);
        }
    }
    getPostClass();
})
function handleFiles(e) {
    if (e.value != "") {
        $('.img_block img').eq($('.img_block img').length - 1).prop("src", window.URL.createObjectURL(e.files[0]));
        $('.img_block img').eq($('.img_block img').length - 1).onload = function () {
            window.URL.revokeObjectURL(e.src);
        }
        e.style.display = "none";
        $('.img_tip').eq($('.img_tip').length - 1).text(e.value.split("\\").reverse()[0]);
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
    console.log(e.value);
    for (let i = 0; i < $('input[type=file]').length; i++) {
        if ($('input[type=file]').eq(i).val().indexOf(`${e.value}`) > -1) {
            $('input[type=file]').eq(i).remove();
            break;
        }
    }
    flag = 1;
}