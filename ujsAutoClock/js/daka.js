if (document.getElementsByTagName('form').length == 1) {
    document.getElementById('xwwd').value = 36.5;
    document.getElementById('swwd').value = 36.5;
    document.getElementById('qtyc').value = '无';
    document.getElementsByTagName('form')[0].submit();
} else {
    try {
        var time = document.getElementsByClassName('weui_media_bd')[0].children[1].innerHTML.substring(7, 27);
        chrome.runtime.sendMessage({ type: 'tips', status: 'success', data: time }, function (response) {});
    } catch(err) {
        //发生错误
        chrome.runtime.sendMessage({ type: 'tips', status: 'fail', data: err }, function (response) {});
    }
}