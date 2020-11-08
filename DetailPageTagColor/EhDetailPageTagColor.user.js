// ==UserScript==
// @name         eh详情页标签颜色
// @namespace    com.xioxin.detailPageTagColor
// @version      0.1
// @description  eh为详情页标签增加颜色,先访问一次我的标签才可生效.
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
    console.log("css", css);
    GM_addStyle(css);
}

if(window.location.pathname == "/mytags")saveMyTagData();
if(window.location.pathname.slice(0, 3) == '/g/')dyeing();