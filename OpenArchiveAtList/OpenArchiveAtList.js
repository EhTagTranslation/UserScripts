// ==UserScript==
// @name         Open Archive at EhList
// @name:zh-CN   Eh列表打开归档
// @namespace    EhTagTranslation
// @version      0.1
// @description  Adding a button to the EhList allows direct access to the archive download page.
// @description:zh-CN 在Eh列表添加按钮，可以直接打开归档下载页面
// @author       Mapaler <mapaler@163.com>
// @copyright    2025, Mapaler <mapaler@163.com>
// @icon         https://e-hentai.org/favicon.ico
// @homepage     https://github.com/EhTagTranslation/UserScripts
// @supportURL   https://github.com/EhTagTranslation/UserScripts/issues
// @match        https://e-hentai.org/*
// @match        https://exhentai.org/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
	const styleText =`
.gldown {
	width: max-content !important;
}
`;
	GM_addStyle(styleText);

	class GalleryInfo {
		url = null;
		downloadButtonParent = null;
		constructor (node, type){
			let link;
			switch (type) {
				case "gld": //缩略图
				{
					link = node.querySelector(".gl3t a");
					break;
				}
				case "glte": //扩展
				{
					link = node.querySelector(".gl1e a");
					break;
				}
				case "gltc": //紧凑
				case "gltm": //最小化
				{
					link = node.querySelector(".glname a");
					break;
				}
			}
			this.url = new URL(link.href);
			this.downloadButtonParent = node.querySelector(".gldown");
		}
		get archiveUrl(){
			const urlParse = /\/g\/(?<gid>\w+)\/(?<token>\w+)\/?/i.exec(this.url.pathname);
			if (!urlParse) console.log(this.url.pathname)
			const urlArchive = new URL("/archiver.php",location);
			urlArchive.searchParams.set("gid", urlParse.groups.gid);
			urlArchive.searchParams.set("token", urlParse.groups.token);
			return urlArchive;
		}
		insertButton() {
			const button = document.createElement("a");
			button.textContent = "\u{1F5C3}\u{FE0F}";
			button.title = "下载归档";
			button.href = this.archiveUrl;
			button.target = "_blank";
			button.onclick = GalleryInfo.openArchive;
			this.downloadButtonParent.appendChild(button);
		}
		static openArchive() {
			//这里的this是按钮
			popUp(this.href,480,320);
			return false;
		}
	}

    const searchList = document.querySelector(".itg");
	if (!searchList) return;
	let listType = null;
	if (searchList.classList.contains("gld")) { //缩略图
		listType = "gld";
	} else if (searchList.classList.contains("gltm")) { //最小化
		listType = "gltm";
	} else if (searchList.classList.contains("gltc")) { //紧凑
		listType = "gltc";
	} else if (searchList.classList.contains("glte")) { //扩展
		listType = "glte";
	}

	let listItems;
	switch (listType) {
		case "gld": {
			listItems = [...searchList.querySelectorAll(".gl1t")];
			break;
		}
		default: {
			listItems = [...searchList.tBodies[0].rows];
			if (!listItems[0]?.querySelector("a")) {
				listItems.shift();
			}
			break;
		}
	}

	const GalleryInfos = listItems.map(node=>new GalleryInfo(node, listType));
	GalleryInfos.forEach(info=>info.insertButton());
})();