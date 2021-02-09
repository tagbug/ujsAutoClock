//js Sleep
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
(async function jielong2(){
	await sleep(1000);
	try{
		document.getElementsByClassName('sbutton')[0].click();
		chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'success' }, function (response) { });
	}catch(e){
		await sleep(2000);
		try{
			document.getElementsByClassName('sbutton')[0].click();
			chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'success' }, function (response) { });
		}catch(e){
			chrome.runtime.sendMessage({ type: 'QQjielonged', status: 'network' }, function (response) { });
		}
	}
})();