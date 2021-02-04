var settings;
function getSettings () {
    chrome.storage.local.get({ inited: false, autotime: '', username: '', password: '' }, function (data) {
        settings = data;
        if (settings.inited) {
            createTimer();
        } else {
            window.open('options.html');
        }
    });
}
getSettings();
var timer;
var autotimer;
function createTimer () {
    window.clearInterval(autotimer);
    window.clearTimeout(timer);
    var time = settings.autotime.split(':');
    var d = new Date();
    d.setHours(time[0], time[1], 0, 0);
    var interval = d - new Date();
    interval = interval < 0 ? 24 * 60 * 60 * 1000 - interval : interval;
    timer = window.setTimeout(function () {
        autodaka();
        autotimer = window.setInterval(function () {
            autodaka();
        }, 24 * 60 * 60 * 1000);
    }, interval);
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'saved') {
        getSettings();
        createTimer();
    }
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'test') {
        getSettings();
        autodaka();
    }
});
function autodaka () {
    //要登录的网址
    var serviceURL = 'http://yun.ujs.edu.cn/xxhgl/yqsb/index';
    //用户名、密码
    var username = settings.username;
    var password = settings.password;
    //js Sleep
    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    //load from "https://pass.ujs.edu.cn/cas/login"
    var xmlhttp = new XMLHttpRequest();
    var captchaHttp = new XMLHttpRequest();
    var login = new XMLHttpRequest();
    var _pwdDefaultEncryptSalt;
    serviceURL = encodeURIComponent(serviceURL);
    var postStr = '';
    var postForm = [
        {
            name: 'lt',
            value: ''
        },
        {
            name: 'dllt',
            value: ''
        },
        {
            name: 'execution',
            value: ''
        },
        {
            name: '_eventId',
            value: ''
        },
        {
            name: 'rmShown',
            value: ''
        }
    ];
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            //是否已登录
            if (xmlhttp.response.indexOf("<i class=\"nav_icon nav_icon_logout\"></i><span>安全退出</span>") != -1) {
                //已登录，直接打卡
                daka();
            } else {
                //读取表单提交项
                for (var i = 0; i < postForm.length; i++) {
                    var searchStr = "name=\"" + postForm[i].name + "\" value=\"";
                    var start = xmlhttp.response.indexOf(searchStr);
                    var end = xmlhttp.response.indexOf("\"", start + searchStr.length);
                    postForm[i].value = xmlhttp.response.substring(start + searchStr.length, end);
                }
                var searchStr = "id=\"pwdDefaultEncryptSalt\" value=\"";
                var start = xmlhttp.response.indexOf(searchStr);
                var end = xmlhttp.response.indexOf("\"", start + searchStr.length);
                _pwdDefaultEncryptSalt = xmlhttp.response.substring(start + searchStr.length, end);
                xmlhttp2.open('GET', 'https://pass.ujs.edu.cn/cas/needCaptcha.html?username=' + username + '&pwdEncrypt2=pwdEncryptSalt&_=' + parseInt(Math.random() * Math.pow(10, 13)));
                xmlhttp2.send();
            }
        }
    }
    xmlhttp.open('GET', 'https://pass.ujs.edu.cn/cas/login', true);
    xmlhttp.send();
    var xmlhttp2 = new XMLHttpRequest();
    xmlhttp2.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //判断是否需要获取验证码
            if (xmlhttp2.response == 'true') {
                captchaHttp.open('GET', 'https://pass.ujs.edu.cn/cas/captcha.html?ts=' + new Date().getMilliseconds(), true);
                captchaHttp.responseType = 'blob';
                captchaHttp.send();
            } else {
                postStr = "username=" + username + "&password=" + encodeURIComponent(encryptAES(password, _pwdDefaultEncryptSalt));
                for (var i = 0; i < postForm.length; i++) {
                    postStr += '&' + postForm[i].name + '=' + postForm[i].value;
                }
                //POST to login
                var login = new XMLHttpRequest();
                login.open('POST', 'https://pass.ujs.edu.cn/cas/login?service=' + serviceURL, true);
                login.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
                login.send(postStr);
            }
        }
    }
    //验证码处理
    var captchaHttp = new XMLHttpRequest();
    var ocrGetToken = new XMLHttpRequest();
    var ocrSingle = new XMLHttpRequest();
    var ocrYoudao = new XMLHttpRequest();
    var ocrGet = new XMLHttpRequest();
    var uuid = getuuid();
    var token = '';
    var captchaBase64 = '';
    var captcha = '';
    //获取匿名uuid
    function getuuid () {
        var e = (new Date).getTime();
        window.performance && "function" === typeof window.performance.now && (e += performance.now());
        var t = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function (t) {
            var n = (e + 16 * Math.random()) % 16 | 0;
            return e = Math.floor(e / 16),
                ("x" == t ? n : 3 & n | 8).toString(16)
        }
        ));
        return t
    }
    //hash计算
    function gethash (e) {
        var t = 0;
        if (0 == e.length)
            return t;
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            t = (t << 5) - t + r,
                t &= t
        }
        return t
    }
    //通过白描ocr获取验证码
    captchaHttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reader = new FileReader();
            reader.readAsDataURL(captchaHttp.response);
            reader.onloadend = function () {
                captchaBase64 = reader.result;
                ocrGetToken.open('POST', 'https://web.baimiaoapp.com/api/user/login/anonymous', true);
                ocrGetToken.setRequestHeader('x-auth-uuid', uuid);
                ocrGetToken.send();
            }
        }
    }
    ocrGetToken.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            token = JSON.parse(ocrGetToken.response).data.token;
            ocrSingle.open('POST', 'https://web.baimiaoapp.com/api/perm/single', true);
            ocrSingle.setRequestHeader('x-auth-uuid', uuid);
            ocrSingle.setRequestHeader('x-auth-token', token);
            ocrSingle.send();
        }
    }
    ocrSingle.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            ocrYoudao.open('POST', 'https://web.baimiaoapp.com/api/ocr/image/youdao', true);
            ocrYoudao.setRequestHeader('x-auth-uuid', uuid);
            ocrYoudao.setRequestHeader('x-auth-token', token);
            ocrYoudao.setRequestHeader('content-type', 'application/json;charset=UTF-8');
            var ocrForm = {
                batchId: "",
                total: 1,
                hash: gethash(captchaBase64),
                name: "captcha.jfif",
                size: captchaBase64.length,
                dataUrl: captchaBase64,
                result: {},
                status: "processing",
                isSuccess: false
            };
            ocrYoudao.send(JSON.stringify(ocrForm));
        }
    }
    ocrYoudao.onreadystatechange = async function () {
        if (this.readyState == 4 && this.status == 200) {
            await sleep(5000);
            ocrGet.open('GET', 'https://web.baimiaoapp.com/api/ocr/image/youdao/status?jobStatusId=' + encodeURIComponent(JSON.parse(ocrYoudao.response).data.jobStatusId), true);
            ocrGet.setRequestHeader('x-auth-uuid', uuid);
            ocrGet.setRequestHeader('x-auth-token', token);
            ocrGet.send();
        }
    }
    ocrGet.onreadystatechange = async function a () {
        if (this.readyState == 4 && this.status == 200) {
            try {
                captcha = JSON.parse(ocrGet.response).data.ydResp.Result.regions[0].lines[0].text.replace(/\u0020/g, '');
                //这里继续登录提交
                postStr = "username=" + username + "&password=" + encodeURIComponent(encryptAES(password, _pwdDefaultEncryptSalt)) + "&captchaResponse=" + captcha;
                for (var i = 0; i < postForm.length; i++) {
                    postStr += '&' + postForm[i].name + '=' + postForm[i].value;
                }
                //POST to login
                login.open('POST', 'https://pass.ujs.edu.cn/cas/login?service=' + serviceURL, true);
                login.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
                login.send(postStr);
            } catch {
                //等待5秒重试
                await sleep(5000);
                a();
            }
        }
    }
    login.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var searchStr = "class=\"auth_error\"";//认证错误
            var start = login.response.indexOf(searchStr);
            if (start == -1) {
                console.log('登录成功');
                daka();
            } else {
                start = login.response.indexOf('>', start) + 1;
                var end = login.response.indexOf('<', start);
                var errorText = login.response.substring(start, end);
                console.log(errorText);
                if (errorText == '无效的验证码') {
                    //重试
                    xmlhttp.open('GET', 'https://pass.ujs.edu.cn/cas/login', true);
                    xmlhttp.send();
                } else if (errorText == '您提供的用户名或者密码有误') {
                    //用户名或密码错误
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: 'img/icon.png',
                        title: 'ujs自动健康打卡',
                        message: '自动打卡失败！（用户名或密码有误）'
                    });
                } else {
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: 'img/icon.png',
                        title: 'ujs自动健康打卡',
                        message: '自动打卡失败！（未知错误：' + errorText + '）'
                    });
                }
            }
        }
    }
    async function daka () {
        status = 0;
        page = window.open('http://yun.ujs.edu.cn/xxhgl/yqsb/grmrsb?v=' + parseInt(Math.random() * 10000));
        checkTimer = window.setInterval(function () {
            if (status == 0) {
                page.location = 'http://yun.ujs.edu.cn/xxhgl/yqsb/grmrsb?v=' + parseInt(Math.random() * 10000);
            }
        }, 2000);
    };
    retryCount = 0;
}
var checkTimer;
var status = 0;
var page;
var retryCount = 0;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'tips') {
        status = 1;
        window.clearInterval(checkTimer);
        if (page) {
            page.close();
        }
        if (request.status == 'success') {
            console.log('自动打卡成功！最新打卡时间：' + request.data);
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujs自动健康打卡',
                message: '自动打卡成功！最新打卡时间：' + request.data
            });
        } else {
            if (retryCount < 5) {
                retryCount += 1;
                autodaka();
            } else {
                chrome.notifications.create(null, {
                    type: 'basic',
                    iconUrl: 'img/icon.png',
                    title: 'ujs自动健康打卡',
                    message: '自动打卡失败！（尝试次数过多）'
                });
            }
        }
    }
});