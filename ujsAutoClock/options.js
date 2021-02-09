var inputs = document.getElementsByTagName('input');
var setting;
chrome.storage.local.get({ username: '', password: '', autotime: '', QQusername: '', QQpassword: '', QQqun: '' }, function (data) {
    inputs[0].value = data.username;
    inputs[1].value = data.password;
    inputs[2].value = data.autotime;
    inputs[3].value = data.QQusername;
    inputs[4].value = data.QQpassword;
    inputs[5].value = data.QQqun;
});
document.getElementById('setting').onsubmit = function () {
    chrome.storage.local.set({ inited: true, username: inputs[0].value, password: inputs[1].value, autotime: inputs[2].value, QQusername: inputs[3].value, QQpassword: inputs[4].value, QQqun: inputs[5].value }, function () {
        chrome.runtime.sendMessage({ type: 'saved' });
        inputs[6].value = "保存成功！";
    });
    return false;
}