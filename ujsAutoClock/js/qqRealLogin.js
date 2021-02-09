//js Sleep
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
chrome.storage.local.get({ QQusername: '', QQpassword: '' }, async function (data) {
    if (data.QQusername != '' && data.QQpassword != '') {
        document.getElementById('u').value = data.QQusername;
        document.getElementById('p').value = data.QQpassword;
		await sleep(1000);
        chrome.runtime.sendMessage({ type: 'QQlogined' }, function (response) { });
        document.getElementById('login_button').click();
    }
});