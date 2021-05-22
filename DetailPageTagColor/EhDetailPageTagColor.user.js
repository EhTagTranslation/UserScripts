// ==UserScript==
// @name         eh详情页标签颜色
// @namespace    com.xioxin.tag-color
// @version      0.2
// @description  eh为详情页标签增加颜色,修改网页图标为标签颜色
// @author       xioxin
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @include     *://exhentai.org/mytags
// @include     *://e-hentai.org/mytags
// @grant    GM_addStyle
// @grant    GM_getValue
// @grant    GM_setValue
// ==/UserScript==

async function saveMyTagData() {
    GM_setValue("myTags", [...document.querySelectorAll('#usertags_outer>div')].map(e => {
        if(e.querySelector('.gt') == null) return
        return {
            tag: e.querySelector('.gt').title,
            background: e.querySelector('.gt').style.background,
            color: e.querySelector('.gt').style.color,
            borderColor: e.querySelector('.gt').style.borderColor,
            weight: e.querySelector('[id^=tagweight]').value,
        }
    }).filter(v => v));
}

async function dyeing() {
    const myTags = GM_getValue("myTags", []);
    let css = '';
    myTags.forEach(v => {
        css += `
        [id="td_${v.tag.replaceAll(' ', '_')}"]{
            border-color: ${v.borderColor} !important;
            background: ${v.background} !important;
        }
        [id="td_${v.tag.replaceAll(' ', '_')}"] a {
            color: ${v.color};
        }
        `
    });
    GM_addStyle(css);
    setTimeout(colorIcon, 10);
}

function colorIcon() {
    const tagColors = [...document.querySelectorAll("#taglist td>div")].map(e => (/(rgb\(.*?\))/ig.exec(getComputedStyle(e).backgroundImage)||[])[0]).filter(v => v);
    const colors = tagColors;
    colors.sort();
    if(!colors.length) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    let ctx = canvas.getContext("2d");
    colors.forEach((c, i) => {
        ctx.fillStyle = ctx.strokeStyle = c;
        ctx.fillRect(canvas.width / colors.length * i, 0, canvas.width / colors.length, canvas.height);
    });
    const link = canvas.toDataURL('image/png');
    let favicon = document.querySelector('link[rel="icon"]');
    if (favicon !== null) {
        favicon.href = link;
    } else {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.href = link;
        document.head.appendChild(favicon);
    }
}


if(window.location.pathname == "/mytags")saveMyTagData();
if(window.location.pathname.slice(0, 3) == '/g/')dyeing();
