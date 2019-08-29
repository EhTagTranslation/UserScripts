// ==UserScript==
// @name        ETTHelper-Thumbnail
// @name:zh-CN	E绅士标签翻译辅助工具-缩略图
// @namespace   http://www.mapaler.com/
// @description Help to get thumbnail for write EhTagTranslation's translation detail.
// @description:zh-CN	一键复制E绅士的缩略图，便于书写标签翻译项目的详细介绍。
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @version     2.2.0
// @grant       GM_setClipboard
// @grant       GM_notification
// @author      Mapaler <mapaler@163.com>
// @copyright	2017+, Mapaler <mapaler@163.com>
// ==/UserScript==

const thumbnailPattern = "https?://(\\d+\\.\\d+\\.\\d+\\.\\d+|ul\\.ehgt\\.org|ehgt\\.org|exhentai\\.org)(?:/t)?/(\\w+)/(\\w+)/(\\w+)\-(\\d+)\-(\\d+)\-(\\d+)\-(\\w+)_(l|250).jpg"; //缩略图地址正则匹配式
var gdtlObj = function(dom){
	this.dom = dom || null;
	this.img = this.dom?dom.querySelector("img"):null;
	this.fullsrc="";
	this.domain="";
	this.path1="";
	this.path2="";
	this.hash1="";
	this.hash2="";
	this.width="";
	this.height="";
	this.extension="";
	this.size="";
	if (this.img)
	{
		this.addImgFromSrc(this.img.src);
	}
}
gdtlObj.prototype.addImgFromSrc = function(src)
{
	if (src == undefined) return false;
	this.fullsrc = src;
	var regSrc = new RegExp(thumbnailPattern, "ig");
	var regResult = regSrc.exec(src);
	if (regResult)
	{
		this.domain = regResult[1];
		this.path1 = regResult[2];
		this.path2 = regResult[3];
		this.hash1 = regResult[4];
		this.hash2 = regResult[5];
		this.width = regResult[6];
		this.height = regResult[7];
		this.extension = regResult[8];
		this.size = regResult[9];
	}
	return true;
};
gdtlObj.prototype.getSrc = function()
{
	var srcA = [];
	srcA.push(location.protocol,"//ehgt.org/",this.path1,"/",this.path2,"/",this.hash1,"-",this.hash2,"-",this.width,"-",this.height,"-",this.extension,"_",this.size,".jpg");
	return srcA.join("");
};
gdtlObj.prototype.addBtnList = function()
{
	var ul = this.dom.appendChild(document.createElement("ul"));
	ul.className = "EWHT-ul";
	ul.thumbSrc = this.getSrc();
	function buildString(){
		var href = ul.thumbSrc;
		var outstr,typeName;
		switch(this.value)
		{
			case "1":
				outstr = "![图](" + href + ")";
				typeName = "MD格式图片地址";
				break;
			case "2":
				outstr = "![图](# \"" + href + "\")";
				typeName = "R18 MD格式图片地址";
				break;
			case "3":
				outstr = "![图](## \"" + href + "\")";
				typeName = "R18G限制级 MD格式图片地址";
				break;
			default:
				outstr = href;
				typeName = "单纯地址";
		}
		GM_setClipboard(outstr);
		GM_notification(outstr, //显示文本
			"已复制到剪贴板 - " +　typeName, //标题
			href //缩略图地址
			);
	}
	function creat_li(caption,value){
		var li = document.createElement("li");
		li.className = "EWHT-li";
		var btn = li.appendChild(document.createElement("button"));
		btn.className = "EWHT-btn";
		btn.appendChild(document.createTextNode(caption));
		btn.value = value;
		btn.onclick = buildString;
		return li
	}
	ul.appendChild(creat_li("纯",0));
	ul.appendChild(creat_li("图",1));
	ul.appendChild(creat_li("隐",2));
	ul.appendChild(creat_li("限",3));
};

var style = document.head.appendChild(document.createElement("style"));
style.type = "text/css";
var styleTxt = `#gdt .gdtl{
	position:relative;
}
#gdt .EWHT-ul{
	top:0px;
	right:0px;
}
#gleft .EWHT-ul{
	top:15px;
	left:-5px;
}
.EWHT-ul{
	position:absolute;
	list-style:none;
	padding:0px;
	margin:0px;
}
.EWHT-ul .EWHT-btn{
	padding:0px;
	font-size:12px;
	width:18px;
}`;
style.innerHTML = styleTxt;

var gdt = document.querySelector("#gdt");
if (gdt) //画廊
{
	var gdtls = gdt.querySelectorAll(".gdtl");
	if (gdtls.length>0)
	{
		for (var gdi= 0; gdi<gdtls.length; gdi++)
		{
			var gdtl_this = new gdtlObj(gdtls[gdi]);
			if (gdtl_this.img) {
				gdtl_this.addBtnList(gdtls[gdi]);
			}
			else console.debug("缩略图解析网址失败");
		}
	}
	else
	{
		console.debug("小图模式，本脚本不起作用。");
	}

}else //都不是
{
	console.debug("本脚本在该页面上不运行");
}