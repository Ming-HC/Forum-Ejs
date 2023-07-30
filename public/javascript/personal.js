$(function () {
    $.ajax({
        type: 'get',
        url: `/member/${window.location.pathname.split('/')[2]}/personal/getdata`,
        success: (req) => {
            if (req.submitfrom == 'google' && req.change_username_times == 0) {
                $('.personalResult').append(`<p>第三方登入的使用者名稱為亂數命名，建議您更改！(僅能更改一次)</p>`);
            }
            var newUL = $('<ul>');
            newUL.append(`<li><span>大頭貼：</span><img  src="${req.headshot? req.headshot.length > 20 ? req.headshot : "/image/member/upload/headshot/"+req.headshot : "/image/member/demo.png" }" /></li>`)
            newUL.append(`<li><span>使用者名稱：</span><span>${req.username}</span>${req.submitfrom == 'google'&& req.change_username_times == 0? '<input type="button" value="更改" />' : ''}</li>`);
            newUL.append(`<li><span>暱稱：</span><span>${req.nickname? req.nickname : ''}</span></li>`);
            newUL.append(`<li><span>Email：</span><span>${req.email? req.email : ''}</span></li>`);
            $('.personalResult').append(newUL);
            $('.personalResult li:nth-of-type(2) input').click ( () => {
                if ($('.personalResult li:nth-of-type(2) input').val() == '更改') {
                    $('.personalResult li:nth-of-type(2)').html('');
                    $('.personalResult li:nth-of-type(2)').append(`<span>使用者名稱：</span>${`<input type="text" value="${req.username}" />`}${req.submitfrom == 'google'&& req.change_username_times == 0? '<input type="button" value="送出" onclick="submitchange()" /><input type="button" value="取消" onclick="cancelChange()" />' : ''}`);
                    $('.personalResult li:nth-of-type(2) input[value="取消"]').attr('onclick', `cancelChange('${req.username}')`);
                }
            })
            
        }
    })
})
function submitchange() {
    $.ajax({
        type: 'put',
        url: `/member/${window.location.pathname.split('/')[2]}/update`,
        data: { username: $('.personalResult li:nth-of-type(2) input[type=text]').val() },
        success: (req) => {
            console.log(req);
            if (req.indexOf('success') > -1) {
                $('#member').text(req.split('is ')[1]);
                $('#member').prop('href', `/member/${req.split('is ')[1]}/personal`);
                location.href = `/member/${req.split('is ')[1]}/personal`;
            }
        }
    })
}
function cancelChange(username) {
    $('.personalResult li:nth-of-type(2)').html('');
    $('.personalResult li:nth-of-type(2)').append(`<span>使用者名稱：</span><span>${username}</span><input type="button" value="更改" />`);
    $('.personalResult li:nth-of-type(2) input').click ( () => {
        if ($('.personalResult li:nth-of-type(2) input').val() == '更改') {
            $('.personalResult li:nth-of-type(2)').html('');
            $('.personalResult li:nth-of-type(2)').append(`<span>使用者名稱：</span><input type="text" value="${username}" /><input type="button" value="送出" onclick="submitchange()" /><input type="button" value="取消" onclick="cancelChange()" />`);
            $('.personalResult li:nth-of-type(2) input[value="取消"]').attr('onclick', `cancelChange('${username}')`);
        }
    })
}