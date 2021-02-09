var settings;
function getSettings () {
    chrome.storage.local.get({ inited: false, autotime: '', username: '', password: '', QQusername: '', QQpassword: '', QQqun: '' }, function (data) {
        settings = data;
        if (settings.inited) {
            createTimer();
        } else {
            window.open('options.html');
        }
    });
}
getSettings();
var nextRunDate;
var checker;
function createTimer () {
    window.clearInterval(checker);
    var time = settings.autotime.split(':');
    var d = new Date();
    nextRunDate = new Date();
    d.setHours(time[0], time[1]);
    if (d - nextRunDate < 0) {
        nextRunDate.setDate(nextRunDate.getDate() + 1);
    }
    nextRunDate.setHours(time[0], time[1]);
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/icon.png',
        title: 'ujs自动健康打卡',
        message: '定时任务创建成功！下次打卡时间：' + nextRunDate.format("yyyy-MM-dd hh:mm:ss"),
        requireInteraction: true,
        priority: 2
    });
    checker = window.setInterval(function () {
        if (nextRunDate - new Date() < 0) {
            statusCount = 0;
            autodaka();
            window.clearInterval(checker);
            nextRunDate.setDate(nextRunDate.getDate() + 1);
            checker = window.setInterval(function () {
                if (nextRunDate - new Date() < 0) {
                    statusCount = 0;
                    nextRunDate.setDate(nextRunDate.getDate() + 1);
                    autodaka();
                }
            }, 10000);
        }
    }, 10000);
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'saved') {
        getSettings();
    }
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'test') {
        getSettings();
        autodaka();
    }
});
//js Sleep
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
var status;
var statusChecker;
var statusCount = 0;
function autodaka () {
    status = 0;
    statusChecker = window.setTimeout(function () {
        if (statusCount >= 10) {
            status = 1;
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujs自动健康打卡',
                message: '自动打卡失败！网络连接问题（尝试次数过多）',
                requireInteraction: true,
                priority: 2
            });
        }
        if (status == 0) {
            statusCount += 1;
            autodaka();
        }
    }, 1000 * 30);
    //要登录的网址
    var serviceURL = 'http://yun.ujs.edu.cn/xxhgl/yqsb/index';
    //用户名、密码
    var username = settings.username;
    var password = settings.password;
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
    ocrGet.onreadystatechange = async function () {
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
                ocrGet.open('GET', 'https://web.baimiaoapp.com/api/ocr/image/youdao/status?jobStatusId=' + encodeURIComponent(JSON.parse(ocrYoudao.response).data.jobStatusId), true);
                ocrGet.setRequestHeader('x-auth-uuid', uuid);
                ocrGet.setRequestHeader('x-auth-token', token);
                ocrGet.send();
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
                        message: '自动打卡失败！（用户名或密码有误）',
                        requireInteraction: true,
                        priority: 2
                    });
                } else {
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: 'img/icon.png',
                        title: 'ujs自动健康打卡',
                        message: '自动打卡失败！（未知错误：' + errorText + '）',
                        requireInteraction: true,
                        priority: 2
                    });
                }
            }
        }
    }
    async function daka () {
        status = 1;
        status2 = 0;
        page = window.open('http://yun.ujs.edu.cn/xxhgl/yqsb/grmrsb?v=' + parseInt(Math.random() * 10000));
        checkTimer = window.setInterval(function () {
            if (status2 == 0) {
                page.location = 'http://yun.ujs.edu.cn/xxhgl/yqsb/grmrsb?v=' + parseInt(Math.random() * 10000);
            }
        }, 2000);
    };
    retryCount = 0;
}
var checkTimer;
var status2 = 0;
var page;
var retryCount = 0;
var loginWindow;
var jielongWindow;
var jielongTimer;
var jielongStatus;
var jielongRetryCount;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'tips') {
        status2 = 1;
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
                message: '自动打卡成功！最新打卡时间：' + request.data,
                requireInteraction: true,
                priority: 2
            });
            if (settings.QQusername != '' && settings.QQpassword != '' && settings.QQqun != '') {
                jielongStatus = 0;
                jielongRetryCount = 0;
                jielongTimer = window.setInterval(function () {
                    if (jielongStatus == 0) {
                        try {
                            loginWindow.close();
                        } catch (e) { }
                        try {
                            jielongWindow.close();
                        } catch (e) { }
                        if (jielongRetryCount < 5) {
                            jielongRetryCount += 1;
                            loginWindow = window.open("https://i.qq.com/");
                        } else {
                            window.clearInterval(jielongTimer);
                            chrome.notifications.create(null, {
                                type: 'basic',
                                iconUrl: 'img/icon.png',
                                title: 'ujs自动健康打卡',
                                message: '自动接龙失败！（自动重试次数过多）' ,
                                requireInteraction: true,
                                priority: 2
                            });
                        }
                    } else {
                        try {
                            loginWindow.close();
                        } catch (e) { }
                        try {
                            jielongWindow.close();
                        } catch (e) { }
                        window.clearInterval(jielongTimer);
                    }
                }, 1000 * 30);
                loginWindow = window.open("https://i.qq.com/");
            }
        } else {
            if (retryCount < 5) {
                retryCount += 1;
                autodaka();
            } else {
                chrome.notifications.create(null, {
                    type: 'basic',
                    iconUrl: 'img/icon.png',
                    title: 'ujs自动健康打卡',
                    message: '自动打卡失败！（尝试次数过多）',
                    requireInteraction: true,
                    priority: 2
                });
            }
        }
    }
});
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type == 'QQlogined') {
        await sleep(2000);
        loginWindow.close();
        jielongWindow = window.open("https://qun.qq.com/homework/qunsolitaire/list.html?_wv=1031&gc=" + settings.QQqun + "&from=appstore_icon&from=qqminiprogram=" + settings.QQqun + "&state=1");
    }
});
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type == 'QQjielonged') {
        await sleep(1000);
        jielongWindow.close();
        if (request.status == "success") {
            jielongStatus = 1;
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujs自动健康打卡',
                message: '自动接龙成功！',
                requireInteraction: true,
                priority: 2
            });
        } else if (request.status == "failed") {
            jielongStatus = 1;
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujs自动健康打卡',
                message: '自动接龙失败，可能已接龙或者过期了？',
                requireInteraction: true,
                priority: 2
            });
        } else {
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujs自动健康打卡',
                message: '自动接龙失败，网络波动',
                requireInteraction: true,
                priority: 2
            });
        }
    }
});
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };

    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }

    return fmt;
}