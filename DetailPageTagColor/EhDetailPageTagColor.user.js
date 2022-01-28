// ==UserScript==
// @name         eh详情页标签颜色
// @namespace    com.xioxin.tag-color
// @version      0.6
// @description  eh为详情页标签增加颜色
// @author       xioxin
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @include     *://exhentai.org/mytags
// @include     *://e-hentai.org/mytags
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
    const msg = document.createElement('div');
    msg.style.clear = 'both';
    msg.style.textAlign = 'center';
    msg.style.width = '100%';
    document.querySelector('#tagset_outer').appendChild(msg);
    const setMsg = (text) => msg.innerText = text;
    try {
        const tags = [];
        for(let id of [...document.querySelectorAll("#tagset_outer select option")].map(v=> v.value)) {
            setMsg(`[详情页标签颜色]正在加载 ${id}`);
            tags.push(...await loadMyTagData(id));
        }
        // 从小到大排序,因为颜色渲染是css,靠后的权重更大.
        tags.sort((a,b) => a.weight - b.weight);
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
