// ==UserScript==
// @name         eh磁力链助手
// @namespace    com.xioxin.EhTagMagnetHelper
// @version      0.1
// @description  在种子列表直接复制磁力链
// @author       xioxin
// @include     *://exhentai.org/gallerytorrents.php*
// @include     *://e-hentai.org/gallerytorrents.php*
// @grant       GM_setClipboard
// ==/UserScript==

async function myNotification(title,options)
{
    let permission = await Notification.requestPermission();
    if(permission == 'granted'){
        return new Notification(title, options);
    }else{
        return false;
    }
}

(function() {
    let tableList = document.querySelectorAll("#torrentinfo form table");
    if(tableList&&tableList.length)tableList.forEach(function (table) {
        let href = '';
        let a = table.querySelector('a');
        if(a)href = a.href;
        if(!href)return;
        let magnet = href.replace(/.*?([0-9a-f]{40}).*$/i,"magnet:?xt=urn:btih:$1") ;
        if(magnet.length != 60)return;
        let insertionPoint = table.querySelector('input');
        if(!insertionPoint)return;
        var button = document.createElement("input");
        button.type = "button";
        button.value = "复制磁力链";
        button.className = 'stdbtn';
        button.onclick = function () {
            GM_setClipboard(magnet);
            myNotification('复制成功',{
                body:magnet
            });
        };
        insertionPoint.parentNode.insertBefore( button, insertionPoint );
    })

})();