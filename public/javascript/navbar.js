$(function () {
    if ($("#membericon").prop("href").indexOf("login") == -1) {
        $.ajax({
            type: 'get',
            url: '/navbar_headshot',
            success: function (req) {
                if (req.headshot) {
                    if (req.headshot.indexOf("headshot") == -1) {
                        $("#membericon img").prop("src", req.headshot);
                    } else {
                        $("#membericon img").prop("src", `/image/member/upload/headshot/${req.headshot}`);
                    }
                } else {
                    $("#membericon img").prop("src", "/image/member/demo.png");
                }
            }
        })
    }
    if ($('#membericon').prop('href').indexOf('login') == -1) {
        $('#membericon').click((e) => {
            e.preventDefault();
            var hint = '是否登出?';
            if (confirm(hint) == true) {
                $.ajax({
                    type: 'put',
                    url: `/member/${window.location.pathname.split('/')[2]}/logout`,
                    success: (req) => {
                        if (req.indexOf('success') > -1) {
                            window.location.reload();
                        }
                    }
                })
            }
        })
    }

    if (window.location.pathname.indexOf('forum') > -1) {
        $('#forum')[0].className = "active";
        $('#member')[0].className = "";
    } else {
        $('#forum')[0].className = "";
        $('#member')[0].className = "active";
    }
})

var prevScrollpos = window.pageYOffset;
window.onscroll = function () {
    var currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
        document.getElementById("myTopnav").style.top = "0";
    } else {
        document.getElementById("myTopnav").style.top = `-${Math.ceil(Number($('#myTopnav').css('height').split('px')[0]))}px`
    }
    prevScrollpos = currentScrollPos;
}
function navbar() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
        $(x).css('display', 'block');
        $('#membericon').css('display', 'none');
    } else {
        x.className = "topnav";
        $(x).css('display', 'flex');
        $('#membericon').css('display', 'inline-block');
    }
}