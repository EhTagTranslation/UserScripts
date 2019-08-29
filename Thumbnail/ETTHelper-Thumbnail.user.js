// ==UserScript==
// @name        ETTHelper-Thumbnail
// @name:zh-CN	E绅士标签翻译辅助工具-缩略图
// @namespace   http://www.mapaler.com/
// @description Help to get thumbnail for write EhTagTranslation's translation detail.
// @description:zh-CN	一键复制E绅士的缩略图，便于书写标签翻译项目的详细介绍。
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @version     2.1.2
// @grant       GM_setClipboard
// @grant       GM_notification
// @author      Mapaler <mapaler@163.com>
// @copyright	2017+, Mapaler <mapaler@163.com>
// ==/UserScript==

const thumbnailPattern = "https?://(\\d+\\.\\d+\\.\\d+\\.\\d+|ul\\.ehgt\\.org|ehgt\\.org|exhentai\\.org)(?:/t)?/(\\w+)/(\\w+)/(\\w+)\-(\\d+)\-(\\d+)\-(\\d+)\-(\\w+)_(l|250).jpg"; //缩略图地址正则匹配式
var gdtlObj = function(){
	this.dom=null;
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
}
gdtlObj.prototype.addImgFrom_gdtlDom = function(dom)
{
	if (dom == undefined) dom = this.dom;
	else this.dom = dom;
	var img = dom.querySelector("img");
	if (img == null) console.log(dom)
	var addsrc = this.addImgFromSrc(img.src);

	if (addsrc)
		return true;
	else
		return false;
};
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
gdtlObj.prototype.replaceImgSrcFrom_gdtlDom = function(dom,type)
{
	if (dom == undefined) dom = this.dom;
	else this.dom = dom;
	var img = dom.getElementsByTagName("img")[0];
	img.src = this.getSrc(type);
};
gdtlObj.prototype.getSrc = function()
{
	var srcA = [];
	srcA.push(location.protocol,"//ehgt.org/",this.path1,"/",this.path2,"/",this.hash1,"-",this.hash2,"-",this.width,"-",this.height,"-",this.extension,"_",this.size,".jpg");
	return srcA.join("");
};
gdtlObj.prototype.addBtnList = function(dom)
{
	if (dom == undefined) dom = this.dom;
	function creat_li(caption,href,type){
		var li = document.createElement("li");
		li.className = "EWHT-li";
		var btn = document.createElement("button");
		btn.className = "EWHT-btn";
		btn.appendChild(document.createTextNode(caption));
		btn.onclick = function(){
			var str = href;
			var typeName = "单纯地址";
			if (caption == "图")
			{
				str = "![图](" + href + ")";
				typeName = "MD格式图片地址";
			}else if (caption == "隐")
			{
				str = "![图](# \"" + href + "\")";
				typeName = "R18 MD格式图片地址";
			}else if (caption == "限")
			{
				str = "![图](## \"" + href + "\")";
				typeName = "R18G限制级 MD格式图片地址";
			}
			GM_setClipboard(str);
			GM_notification(str,"已复制到剪贴板 - " +　typeName,href);
		}
		
		li.appendChild(btn);
		return li
	}
	var ul = document.createElement("ul");
	ul.className = "EWHT-ul";
	ul.appendChild(creat_li("纯",this.getSrc()));
	ul.appendChild(creat_li("图",this.getSrc()));
	ul.appendChild(creat_li("隐",this.getSrc()));
	ul.appendChild(creat_li("限",this.getSrc()));
	dom.appendChild(ul);
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
.itg .id1{
	position:relative;
}
.itg .EWHT-ul{
	top:33px;
	right:-5px;
}
#i3{
	position:relative;
}
#i3 .EWHT-ul{
	top:-30px;
	right:0px;
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
var itg = document.querySelector(".itg");
if (gdt) //画廊
{
	var gdtls = gdt.getElementsByClassName("gdtl");
	if (gdtls.length>0)
	{
		for (var gdi = 0,len= gdtls.length ; gdi <len; gdi++)
		{
			var gdtl_this = new gdtlObj;
			var addRes = gdtl_this.addImgFrom_gdtlDom(gdtls[gdi]);
			if (addRes) {
				gdtl_this.addBtnList(gdtls[gdi]);
			}
			else console.debug("缩略图添加网址失败");
		}
	}
	else
	{
		console.debug("小图模式，本脚本不起作用。");
	}

}
else if (itg) //搜索列表
{
	var id1s = itg.getElementsByClassName("id1");
	if (id1s.length>0)
	{
		for (var id1i = 0,len= id1s.length ; id1i <len; id1i++)
		{
			var id3s = id1s[id1i].querySelector(".id3");
			var id3_this = new gdtlObj;
			var addRes = id3_this.addImgFrom_gdtlDom(id3s);
			if (addRes) id3_this.addBtnList(id1s[id1i]);
			else console.debug("添加网址失败");
		}
	}
	else
	{
		console.debug("找不到图象列表。");
	}
}
else //都不是
{
	console.debug("本脚本在该页面上不运行");
}