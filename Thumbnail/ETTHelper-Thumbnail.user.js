// ==UserScript==
// @name        ETTHelper-Thumbnail
// @name:zh-CN  E绅士标签翻译辅助工具-缩略图
// @namespace   EhTagTranslation
// @description Help to get thumbnail for write EhTagTranslation's translation detail.
// @description:zh-CN 一键复制E绅士的缩略图，便于书写标签翻译项目的详细介绍。
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @include     *://e-hentai.org/lofi/g/*
// @include     *://upl*d.e-hentai.org/managegallery*
// @include     *://upl*d.e-hentai.org/upl*d/managegallery*
// @include     *://exhentai.org/upl*d/managegallery*
// @include     *://upl*d.exhentai.org/upl*d/managegallery*
// @resource    ui-style https://github.com/EhTagTranslation/UserScripts/raw/master/Thumbnail/ETTHelper-Thumbnail.ui.css?v=3.1
// @version     3.2.0
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_notification
// @author      Mapaler <mapaler@163.com>
// @copyright   2017+, Mapaler <mapaler@163.com>
// @homepage    https://github.com/EhTagTranslation/UserScripts
// @supportURL  https://github.com/EhTagTranslation/UserScripts/issues
// ==/UserScript==

(()=>{
	const styleText = GM_getResourceText("ui-style");
	GM_addStyle(styleText);
	const { thumbs, thumbType } = (()=>{
		let thumbs, thumbType;
		if (/^\/g\//.test(location.pathname)) {//图像画廊
			thumbs = Array.from(document.querySelectorAll('#gdt>a'));
			thumbType = 'gallery';
		}
		else if (/^\/lofi\//.test(location.pathname)) {//手机版画廊
			thumbs = Array.from(document.querySelectorAll('#gh>a'));
			thumbType = 'lofi';
		}
		else if (/managegallery/.test(location.pathname)) {//画廊编辑
			thumbs = Array.from(document.querySelectorAll('#t>.nosel>div'));
			thumbType = 'upload';
		}
		return { thumbs, thumbType };
	})();

	if (thumbType === 'gallery' || thumbType === 'lofi') {
		const pageLink = thumbs[0]?.nodeName == 'A' ? thumbs[0] : thumbs[0]?.querySelector('a');
		const match = pageLink.pathname.match(/\-(\d+)$/);
		const firstPage = parseInt(match[1],10);
		const styleText2 = `
			body{
				counter-reset: page ${firstPage-1};
			}
			.EWHT-ul::before{
				counter-increment: page;
				content: "P" counter(page) ": ";
			}
		`;
		GM_addStyle(styleText2);
	}

	const getImgId = (src) => {
		const url = new URL(src);
		if (url.searchParams.get('fileid'))
		{
			return url.searchParams.get('fileid');
		}else
		{
			const RegRes = /(\w+)\-(\d+)\-(\d+)\-(\d+)\-(\w+)(?:_l|_250)\b/i.exec(src);
			if (RegRes) {
				return `${RegRes[1]}-${RegRes[2]}-${RegRes[3]}-${RegRes[4]}-${RegRes[5]}`;
			}
			else {
				return null;
			}
		}
	}

	function copyString(event) {
		event.stopPropagation();
		event.preventDefault();

		const type = this.dataset.type;
		const imgNode = this.parentNode.parentNode.parentNode.querySelector(":where(img, [title][style*=background])");

		const src_original = ((node)=>{
			if (node.nodeName == "IMG") return node.src;
			const computedStyle = window.getComputedStyle(node, false);
			const bgiSrc = computedStyle.backgroundImage.replace(/url\(["']?(.+?)["']?\)/gi, "$1");
			return URL.canParse(bgiSrc) && bgiSrc;
		})(imgNode);

		const fileId = getImgId(src_original);
		if (fileId === null) {
			alert('错误：\n未找到符合格式的图片 ID。');
			return;
		}
		const src_out = `https://ehgt.org/${fileId.substring(0,2)}/${fileId.substring(2,4)}/${fileId}_l.jpg`

		let outstr,typeName;
		switch(type) {
			case "图":{
				outstr = `![${type}](${src_out})`;
				typeName = "MD 格式图片地址";
				break;
			}
			case "隐":{
				outstr = `![${type}](# "${src_out}")`;
				typeName = "R18 MD 格式图片地址";
				break;
			}
			case "限":{
				outstr = `![${type}](## "${src_out}")`;
				typeName = "R18G 限制级 MD 格式图片地址";
				break;
			}
			default:{
				outstr = src_out;
				typeName = "单纯图片地址";
				break;
			}
		}

		GM_setClipboard(outstr);
		GM_notification(outstr, //显示的文本
			`已复制到剪贴板 - ${typeName}`, //标题
			//src_original //显示原版地址，这样可以节省加载时间
		);
	}

	const creat_li = (type) => {
		const li = document.createElement("li");
		li.className = "EWHT-li";
		const btn = li.appendChild(document.createElement("button"));
		btn.className = "EWHT-btn";
		btn.dataset.type = type;
		btn.onclick = copyString;
		return li
	}
	const buildBtnList = () => {
		const list = ["纯","图","隐","限"].map(creat_li);
		const ul = document.createElement("ul");
		ul.className = "EWHT-ul";
		ul.append(...list);
		return ul;
	}

	thumbs.forEach(thumb=>{
		// //获取到图像
		// const img = thumb.querySelector(":where(img, [title][style*=background])");
		// //如果图像有title
		// if (img.title) {
		// 	const filename = document.createElement("div");
		// 	filename.className = "filename";
		// 	filename.textContent = img.title;
		// 	img.parentElement.append(filename);
		// }

		thumb.appendChild(buildBtnList());
	});
})();