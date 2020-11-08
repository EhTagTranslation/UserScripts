// ==UserScript==
// @name         eh阅读状态
// @namespace    com.xioxin.EhTagReadStatus
// @version      0.1
// @description  利用css ":visited" 特性在标题前增加阅读状态指示
// @author       xioxin
// @include     *://exhentai.org/*
// @include     *://e-hentai.org/*
// @grant    GM_addStyle
// ==/UserScript==

GM_addStyle(`
.itg a .glink::before {
    content: "●";
    color: #1a9317;
    padding-right: 4px;
}
.itg a:visited .glink::before {
    color: #aaa;
}`);