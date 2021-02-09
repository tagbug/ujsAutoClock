//js Sleep
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
(async function jielong () {
    await sleep(2000);
    try {
        if (document.getElementsByClassName('list-item')[0].children[2].innerText == "已接龙" || document.getElementsByClassName('list-item')[0].children[2].innerText == "已结束") {
            chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'failed' }, function (response) { });
        } else {
            document.getElementsByClassName('list-item')[0].click();                    
        }
    } catch (e) {
        await sleep(2000);
        try {
            if (document.getElementsByClassName('list-item')[0].children[2].innerText == "已接龙" || document.getElementsByClassName('list-item')[0].children[2].innerText == "已结束") {
                chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'failed' }, function (response) { });
            } else {
                document.getElementsByClassName('list-item')[0].click();
            }
        } catch (e) {
            chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'network' }, function (response) { });
        }
    }
})();