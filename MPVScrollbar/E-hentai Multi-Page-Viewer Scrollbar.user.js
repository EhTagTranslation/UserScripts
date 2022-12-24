// ==UserScript==
// @name         E-hentai Multi-Page-Viewer Scrollbar
// @version      0.2
// @description  给E-hentai的多页查看器页面加上滚动条
// @author       SchneeHertz
// @homepage     https://github.com/SchneeHertz/EH-UserScripts
// @supportURL   https://github.com/SchneeHertz/EH-UserScripts/issues
// @match        https://e-hentai.org/mpv/*
// @match        https://exhentai.org/mpv/*
// @grant        GM_addStyle
// ==/UserScript==


GM_addStyle(`
    div#bar3 {
        left: -20px;
    }
    div#pane_images {
        overflow-x: hidden;
        overflow-y: scroll;
    }
`);