// ==UserScript==
// @name         eh磁力链助手
// @namespace    com.xioxin.EhTagMagnetHelper
// @version      0.3
// @description  在种子列表直接复制磁力链
// @author       xioxin
// @icon         https://e-hentai.org/favicon.ico
// @homepage     https://github.com/EhTagTranslation/UserScripts
// @supportURL   https://github.com/EhTagTranslation/UserScripts/issues
// @match        *://exhentai.org/gallerytorrents.php*
// @match        *://e-hentai.org/gallerytorrents.php*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    const tableList = document.querySelectorAll("#torrentinfo form table");
    if (tableList && tableList.length) {
        tableList.forEach((table) => {
            const href = table.querySelector('a')?.href;
            if (!href) return;
            const magnet = href.replace(/.*?([0-9a-f]{40}).*$/i,"magnet:?xt=urn:btih:$1") ;
            if (magnet.length != 60) return;
            const insertionPoint = table.querySelector('button');
            if (!insertionPoint) return;
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "复制磁力链";
            button.value = "复制磁力链";
            button.setAttribute('ehs-input', '');
            button.style.marginBottom = '4px'
            button.onclick = () => {
                GM_setClipboard(magnet);
                button.textContent = "✅已复制";
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = "复制磁力链";
                }, 1000)
            };
            insertionPoint.parentNode.insertBefore( button, insertionPoint );
        })
    }
})();
