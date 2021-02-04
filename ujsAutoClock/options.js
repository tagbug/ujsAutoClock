var inputs = document.getElementsByTagName('input');
var setting;
chrome.storage.local.get({ username: '', password: '', autotime: '' }, function (data) {
    inputs[0].value = data.username;
    inputs[1].value = data.password;
    inputs[2].value = data.autotime;
});
document.getElementById('setting').onsubmit = function () {
    chrome.storage.local.set({ inited: true, username: inputs[0].value, password: inputs[1].value, autotime: inputs[2].value }, function () {
        chrome.runtime.sendMessage({ type: 'saved' });
        inputs[3].value = "保存成功！";
    });
    return false;
}