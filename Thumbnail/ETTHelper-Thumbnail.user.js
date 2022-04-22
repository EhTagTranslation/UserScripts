// ==UserScript==
// @name        ETTHelper-Thumbnail
// @name:zh-CN  E绅士标签翻译辅助工具-缩略图
// @namespace   EhTagTranslation
// @description Help to get thumbnail for write EhTagTranslation's translation detail.
// @description:zh-CN 一键复制E绅士的缩略图，便于书写标签翻译项目的详细介绍。
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @include     *://e-hentai.org/lofi/g/*
// @include     *://upload.e-hentai.org/managegallery*
// @include     *://exhentai.org/upload/managegallery*
// @resource    ui-style https://github.com/EhTagTranslation/UserScripts/raw/master/Thumbnail/ETTHelper-Thumbnail.ui.css?v=3.0.3
// @version     3.0.3
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_notification
// @author      Mapaler <mapaler@163.com>
// @copyright   2017+, Mapaler <mapaler@163.com>
// @homepage    https://github.com/EhTagTranslation/UserScripts
// @supportURL  https://github.com/EhTagTranslation/UserScripts/issues
// ==/UserScript==

GM_addStyle(GM_getResourceText("ui-style"));
let thumbs;
if (/^\/g\//.test(location.pathname)) //图像画廊
{
	thumbs = Array.from(document.querySelectorAll('#gdt .gdtl'));
}else if (/^\/lofi\//.test(location.pathname)) //手机版画廊
{
	thumbs = Array.from(document.querySelectorAll('#gh .gi'));
}else if (/managegallery/.test(location.pathname)) //画廊编辑
{
	thumbs = Array.from(document.querySelectorAll('#t div[id^="cell_"]'));
}
thumbs.forEach(thumb=>{
	//thumb.style.height = null;
	thumb.appendChild(buildBtnList());
});

function getImgId(src)
{
	const url = new URL(src);
	if (url.searchParams.get('fileid'))
	{
		return url.searchParams.get('fileid');
	}else
	{
		let RegRes = /(\w+)\-(\d+)\-(\d+)\-(\d+)\-(\w+)(?:_l|_250)\b/i.exec(src);
		if (RegRes)
		{
			return `${RegRes[1]}-${RegRes[2]}-${RegRes[3]}-${RegRes[4]}-${RegRes[5]}`;
		}else
		{
			return null;
		}
	}
}
function copyString(){
	const type = parseInt(this.value);
	const src_original = this.parentNode.parentNode.parentNode.querySelector('img').src;
	const fileId = getImgId(src_original);
	if (fileId == null)
	{
		alert('错误：\n未找到符合格式的图片 ID。');
	}
	const src_out = `https://ehgt.org/${fileId.substr(0,2)}/${fileId.substr(2,2)}/${fileId}_l.jpg`
	
	let outstr,typeName;
	switch(type)
	{
		case 1:{
			outstr = `![图](${src_out})`;
			typeName = "MD 格式图片地址";
			break;
		}
		case 2:{
			outstr = `![图](# "${src_out}")`;
			typeName = "R18 MD 格式图片地址";
			break;
		}
		case 3:{
			outstr = `![图](## "${src_out}")`;
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
		"已复制到剪贴板 - " +　typeName, //标题
		src_out //缩略图地址
		);
}
function buildBtnList()
{
	const ul = document.createElement("ul");
	ul.className = "EWHT-ul";
	function creat_li(caption,value){
		const li = document.createElement("li");
		li.className = "EWHT-li";
		const btn = li.appendChild(document.createElement("button"));
		btn.className = "EWHT-btn";
		btn.appendChild(document.createTextNode(caption));
		btn.value = value;
		btn.onclick = copyString;
		return li
	}
	ul.appendChild(creat_li("纯",0));
	ul.appendChild(creat_li("图",1));
	ul.appendChild(creat_li("隐",2));
	ul.appendChild(creat_li("限",3));
	return ul;
}