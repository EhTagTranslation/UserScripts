// ==UserScript==
// @name         eh详情页标签颜色
// @namespace    com.xioxin.tag-color
// @version      0.8
// @description  eh为详情页标签增加颜色
// @author       xioxin
// @homepage     https://github.com/EhTagTranslation/UserScripts
// @supportURL   https://github.com/EhTagTranslation/UserScripts/issues
// @match     *://exhentai.org/g/*
// @match     *://e-hentai.org/g/*
// @match     *://exhentai.org/mytags
// @match     *://e-hentai.org/mytags
// @grant    GM_addStyle
// @grant    GM_getValue
// @grant    GM_setValue
// ==/UserScript==


if(typeof GM_getValue == 'undefined') {
    function GM_getValue(key, val) {return JSON.parse(localStorage.getItem(key)||'null') || val }
}

if(typeof GM_addStyle == 'undefined') {
    function GM_addStyle(script){
        var style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML=script
        document.getElementsByTagName("HEAD").item(0).appendChild(style);
    }
}
if(typeof GM_setValue == 'undefined') {
    function GM_setValue(key, val) {localStorage.setItem(key, JSON.stringify(val))}
}

async function saveMyTagData() {
    const box = document.createElement('div');
    box.style.textAlign = 'center';
    const msg = document.createElement('div');
    msg.style.clear = 'both';
    msg.style.textAlign = 'center';
    msg.style.width = '100%';
    box.appendChild(msg);
    document.querySelector('#tagset_form').appendChild(box);

    // 是否重新排序详情页标签复选框
    const reorderCheckbox = document.createElement('input');
    reorderCheckbox.type = 'checkbox';
    reorderCheckbox.id = 'reorder_tags';
    reorderCheckbox.checked = GM_getValue("reorderTags", true);
    const reorderLabel = document.createElement('label');
    const reorderSpan = document.createElement('span');
    reorderSpan.textContent = '将详情页标签按权重重新排序';
    reorderLabel.appendChild(reorderCheckbox);
    reorderLabel.appendChild(reorderSpan);
    reorderLabel.style.textAlign = 'center';
    reorderLabel.style.cursor = 'pointer';
    box.appendChild(reorderLabel);

    reorderCheckbox.addEventListener('change', (e) => {
        console.log("reorderTags", e.target.checked);
        GM_setValue("reorderTags", e.target.checked);
    });

    const setMsg = (text) => msg.innerText = text;
    try {
        const tags = [];
        for(let id of [...document.querySelectorAll("#tagset_outer select option")].map(v=> v.value)) {
            setMsg(`[详情页标签颜色]正在加载 ${id}`);
            tags.push(...await loadMyTagData(id));
        }
       
        GM_setValue("myTags", tags);
        setMsg(`[详情页标签颜色] 已更新 共${tags.length}个`);
    } catch (e) {
        setMsg(`[详情页标签颜色] 错误: ${e.message}`);
    }
}


async function loadMyTagData(tageset) {
    const html = await fetch(`${document.location.origin}/mytags?tagset=${tageset || 1}`, {credentials: "include"}).then(v => v.text());
    const safeHtml = html.replace(/^.*<body>(.*)<\/body>.*$/igms,"$1").replace(/<script.*?>(.*?)<\/script>/igms, '');
    const dom = document.createElement('div');
    dom.innerHTML = safeHtml;
    const tags = [...dom.querySelectorAll('#usertags_outer>div')].map(e => {
        if(e.querySelector('.gt') == null) return
        return {
            tag: e.querySelector('.gt').title,
            background: e.querySelector('.gt').style.background,
            color: e.querySelector('.gt').style.color,
            borderColor: e.querySelector('.gt').style.borderColor,
            weight: parseInt(e.querySelector('[id^=tagweight]').value, 10),
        }
    }).filter(v => v);
    return tags;
}


async function dyeing() {
    setTimeout(colorIcon, 0);
    const myTags = GM_getValue("myTags", []);
    let css = '';
    // 从小到大排序,因为颜色渲染是css,靠后的权重更大.
    myTags.sort((a,b) => a.weight - b.weight);
    myTags.forEach(v => {
        const key = v.tag.replaceAll(' ', '_');
        const id = `td_${key}`;
        v.id = id;
        css += `
        [id="${id}"]{
            border-color: ${v.borderColor} !important;
            background: ${v.background} !important;
        }
        [id="${id}"].gtw, [id="${id}"].gtl{
            outline: solid 1px ${v.borderColor};
            border-color: ${v.color} !important;
        }
        [id="${id}"] a {
            color: ${v.color};
        }
        .tup::after, .tdn::after {
            display: inline-block;
            color: #fff;
            border-radius: 4px;
            margin-left: 4px;
            margin-right: -2px;
            background-color: green;
            content: '';
            line-height: 14px;
            outline: solid 1px #fff;
            vertical-align: sub;
            width: 4px;
            height: 14px;
        }
        .tdn::after {
            background-color: red;
        }
        `
    });
    GM_addStyle(css);
    if(GM_getValue("reorderTags", true))sortTags(myTags);
}

async function sortTags(myTags) {
    const tagsMap = {};
    myTags.forEach(v => tagsMap[v.id] = v);
    const targetTds = document.querySelectorAll('#taglist td:not(.tc)');
    targetTds.forEach(td => {
        const children = Array.from(td.children);
        children.sort((a, b) => {
            const weightA = tagsMap[a.id]?.weight || 0;
            const weightB = tagsMap[b.id]?.weight || 0;
            return weightB - weightA;
        });
        children.forEach(child => td.appendChild(child));
    });
}

function colorIcon() {
    const myTags = GM_getValue("myTags", []);
    const tagIds = [...document.querySelectorAll("#taglist td>div")].map(v => v.id.replace('td_', '').replaceAll('_', ' '));
    const tags = tagIds.map(id => myTags.find(v => v.tag == id)).filter(v => v);
    tags.sort((a, b) => parseInt(a.weight) - parseInt(b.weight));
    const weight = tags.reduce((accumulator, tag) => accumulator + parseInt(tag.weight), 0);
    const colors = tags.map(tag => (/(rgb\(.*?\))/ig.exec(tag.borderColor)||[])[0]).filter(v => v);
    if(!colors.length) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const edgeSize = 8;
    let ctx = canvas.getContext("2d");
    colors.forEach((c, i) => {
        ctx.fillStyle = ctx.strokeStyle = c;
        ctx.fillRect((canvas.width - edgeSize*2) / colors.length * i + edgeSize, 0, (canvas.width - edgeSize*2) / colors.length, canvas.height);
    });
    ctx.globalCompositeOperation="destination-in";
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.roundRect(edgeSize/2,edgeSize/2,canvas.width - edgeSize,canvas.height - edgeSize, 20).fill();
    ctx.globalCompositeOperation="source-over";
    ctx.lineWidth = edgeSize;
    ctx.strokeStyle = "#5C0D11";
    ctx.stroke();
    ctx.font = '100px Consolas, Monaco, monospace';
    const tw = ctx.measureText("w").width;
    const fs = Math.min((( 100 / (tw * 3))) * canvas.width, canvas.width );
    ctx.font = `${fs.toFixed(2)}px Consolas, Monaco, monospace`;
    ctx.fillStyle = "#5C0D11";
    ctx.strokeStyle = "#FFF";
    const t = `${weight}`;
    const tl = t.length > 2 ? edgeSize : edgeSize * 2;
    ctx.strokeText(`${weight}`,tl, fs);
    ctx.fillText(`${weight}`, tl, fs);
    canvas.toBlob(function(blob) {
        const link = canvas.toDataURL('image/png');
        const favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.href = URL.createObjectURL(blob);
        document.head.appendChild(favicon);
    });
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y, x+w, y+h, r);
    this.arcTo(x+w, y+h, x, y+h, r);
    this.arcTo(x, y+h, x, y, r);
    this.arcTo(x, y, x+w, y, r);
    this.closePath();
    return this;
}

if(window.location.pathname == "/mytags")saveMyTagData();
if(window.location.pathname.slice(0, 3) == '/g/')dyeing();
