// ==UserScript==
// @name         EhAria2下载助手
// @namespace    com.xioxin.AriaEh
// @version      0.2
// @description  发送任务到Aria2,并查看下载进度
// @author       xioxin
// @include      *://exhentai.org/*
// @include      *://e-hentai.org/*
// @include      *hath.network/archive/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

// ↓↓↓↓↓↓↓ 用户参数配置区域 ↓↓↓↓↓↓↓

// 如果你的下载服务器不是本机,需要的将域名添加到: 设置 - XHR 安全 - 用户域名白名单

// ARIA2地址
let ARIA2_RPC = "http://127.0.0.1:6800/jsonrpc";

// 密钥
let ARIA2_SECRET = "";

// 保存文件位置,留空将下载到默认位置,例如 /Downloads 或者 D:\Downloads
let ARIA2_DIR = "";


// 一键下载画质 原始档案:org 重采样档案:res
const ONE_CLICK_DOWNLOAD_DLTYPE = "org";

// 在列表页与详情页增加档案增加一键下载 (禁用请将true改为false)
const USE_ONE_CLICK_DOWNLOAD = true;

// 在搜索列表页展示下载进度
const USE_LIST_TASK_STATUS = true;

// 在画廊详情页展示下载进度
const USE_GALLERY_DETAIL_TASK_STATUS = true;

// 在档案下载页面展示下载进度
const USE_HATH_ARCHIVE_TASK_STATUS = true;

// 在种子下载页面展示下载进度
const USE_TORRENT_TASK_STATUS = true;

// ↑↑↑↑↑↑↑ 用户参数配置区域 ↑↑↑↑↑↑↑


// 本地保存的配置
ARIA2_RPC = GM_getValue('ARIA2_RPC', ARIA2_RPC);
ARIA2_SECRET = GM_getValue('ARIA2_SECRET', ARIA2_SECRET);
ARIA2_DIR = GM_getValue('ARIA2_DIR', ARIA2_DIR);

let ARIA2_CLIENT_ID = GM_getValue('ARIA2_CLIENT_ID', '');
if (!ARIA2_CLIENT_ID) {
    ARIA2_CLIENT_ID = "EH-" + new Date().getTime();
    GM_setValue("ARIA2_CLIENT_ID", ARIA2_CLIENT_ID);
}

const IS_EX = window.location.host.includes("exhentai");
const IS_TORRENT_PAGE = window.location.href.includes("gallerytorrents.php");
const IS_HATH_ARCHIVE_PAGE = window.location.href.includes("hath.network/archive");
const IS_GALLERY_DETAIL_PAGE = window.location.href.includes("/g/");

const STYLE = `
.aria2helper-box {
    height: 27px;
    line-height: 27px;
}
.aria2helper-button { }
.aria2helper-loading { }
.aria2helper-message { cursor: pointer;  }
.aria2helper-status {
    display: none;
    padding: 4px 4px;
    font-size: 12px;
    text-align: center;
    background: rgba(${IS_EX ? '0,0,0': '255,255,255'}, 0.6);
    margin: 4px 8px;
    border-radius: 4px;
    font-weight: normal;
    white-space: normal;
    box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}
.glname .aria2helper-status {
    margin: 4px 0px;
}
.gl3e .aria2helper-status {
    margin: 0px 4px;
    padding: 4px 4px;
    width: 112px !important;
    white-space: normal;
    box-sizing: border-box;
    text-align: center !important;
}
.gl3e .aria2helper-status span {
    display: block;
}
.gl1t .aria2helper-status{
    margin: 4px 4px;
}
`;


const ONE_CLICK_STYLE = `
.aria2helper-one-click {
    width: 15px;
    height: 15px;
    background: radial-gradient(#ffc36b,#c56a00);    border-radius: 15px;
    border: 1px #666 solid;
    box-sizing: border-box;
    color: #ebeae9;
    text-align: center;
    line-height: 15px;
    cursor: pointer;
    user-select: none;
}
.aria2helper-one-click:hover {
    background: radial-gradient(#bf893b,#985200);
}
.gldown {
    width: 35px !important;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.gl3e>div:nth-child(6) {
    left: 45px;
}

.aria2helper-one-click svg circle {
    stroke: #fff !important;
    stroke-width: 15px !important;
}
.aria2helper-one-click svg {
    width: 10px;
    display: inline-block;
    height: 10px;
    padding-top: 1.3px;
}
.gsp .aria2helper-one-click {
    display: inline-block;
    margin-left: 8px;
    vertical-align: -1.5px;
}


`;

const SVG_LOADING_ICON = `<svg style="margin: auto; display: block; shape-rendering: auto;" width="24px" height="24px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
<circle cx="50" cy="50" fill="none" stroke="${IS_EX ? '#f1f1f1': '#5C0D11'}" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
  <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
</circle></svg>`;

const ARIA2_ERROR_MSG = {
    '2': '操作超时',
    '3': '无法找到指定资源',
    '4': "无法找到指定资源.",
    '5': "由于下载速度过慢, 下载已经终止.",
    '6': "网络问题",
    '8': "服务器不支持断点续传",
    '9': "可用磁盘空间不足",
    '10': "分片大小与 .aria2 控制文件中的不同.",
    '11': "aria2 已经下载了另一个相同文件.",
    '12': "aria2 已经下载了另一个相同哈希的种子文件.",
    '13': "文件已经存在.",
    '14': "文件重命名失败.",
    '15': "文件打开失败.",
    '16': "文件创建或删除已有文件失败.",
    '17': "文件系统出错.",
    '18': "无法创建指定目录.",
    '19': "域名解析失败.",
    '20': "解析 Metalink 文件失败.",
    '21': "FTP 命令执行失败.",
    '22': "HTTP 返回头无效或无法识别.",
    '23': "指定地址重定向过多.",
    '24': "HTTP 认证失败.",
    '25': "解析种子文件失败.",
    '26': '指定 ".torrent" 种子文件已经损坏或缺少 aria2 需要的信息.',
    '27': '指定磁链地址无效.',
    '28': '设置错误.',
    '29': '远程服务器繁忙, 无法处理当前请求.',
    '30': '处理 RPC 请求失败.',
    '32': '文件校验失败.'
};

class AriaClientLite {
    constructor(opt = {}) {
        this.rpc = opt.rpc;
        this.secret = opt.secret;
        this.id = opt.id;
    }

    async addUri(url, dir = '') {
        const response = await this.post(this.rpc, this._addUriParameter(url, dir));
        return this.singleResponseGuard(response);
    }

    async tellStatus(id) {
        const response = await this.post(this.rpc, this._tellStatusParameter(id));
        return this.singleResponseGuard(response);
    }

    async batchTellStatus(ids = []) {
        if(!ids.length) return [];
        const dataList = ids.map(id => this._tellStatusParameter(id));
        const response = await this.post(this.rpc, dataList);
        if(response.responseType !== 'json') throw `不支持的数据格式: ${response.status}`;
        const json = JSON.parse(response.responseText);
        if(!Array.isArray(json)) throw "批量请求数据结构错误";
        return json.map(v => v.result);
    }

    request(url, opt={}) {
        return new Promise((resolve, reject) => {
            opt.onerror = opt.ontimeout = reject
            opt.onload = resolve
            GM_xmlhttpRequest({
                url,
                timeout: 2000,
                responseType: 'json',
                ...opt
            });
        })
    }

    post(url, data = {}) {
        return this.request(url, {
            method: "POST",
            data: JSON.stringify(data),
        });
    }

    singleResponseGuard(response) {
        if(response.responseType !== 'json') {
            throw `不支持的数据格式: ${response.status}`;
        }
        const json = JSON.parse(response.responseText);
        if(response.status !== 200 && json && json.error) throw `${json.error.code} ${json.error.message}`;
        if(response.status !== 200) throw `错误: ${response.status}`;
        return json.result;
    }

    _jsonRpcPack(method, params) {
        if (this.secret) params.unshift("token:" + this.secret);
        return {
            "jsonrpc": "2.0",
            "method": method,
            "id": ARIA2_CLIENT_ID,
            params
        }
    }

    _addUriParameter(url, dir = '') {
        const opt = {"follow-torrent": 'true'};
        return this._jsonRpcPack('aria2.addUri', [ [url], opt ]);
    }

    _tellStatusParameter(id) {
        return this._jsonRpcPack('aria2.tellStatus', [id]);
    }

}

class SendTaskButton {
    constructor(gid, link) {
        this.element = document.createElement("div");;
        this.link = link;
        this.gid = gid;

        this.element.className = "aria2helper-box";
        this.loading = document.createElement("div");
        this.loading.className = "aria2helper-loading";
        this.loading.innerHTML = SVG_LOADING_ICON;

        this.message = document.createElement("div");
        this.message.className = "aria2helper-message";

        this.button = document.createElement("input");
        this.button.type = "button";
        this.button.value = "发送到Aria2";
        this.button.className = 'stdbtn aria2helper-button';
        this.button.onclick = () => this.buttonClick();
        this.element.appendChild(this.button);
        this.element.appendChild(this.loading);
        this.element.appendChild(this.message);
        this.message.onclick = () => this.show(this.button);
        this.show(this.button);
    }

    show(node) {
        this.loading.style.display = 'none';
        this.message.style.display = 'none';
        this.button.style.display = 'none';
        node.style.display = '';
    }

    showMessage(msg) {
        this.message.textContent = msg;
        this.show(this.message);
    }
    showLoading() {
        this.show(this.loading);
    }

    async buttonClick() {
        this.showLoading();
        try {
            const id = await ariaClient.addUri(this.link);
            Tool.setTaskId(this.gid, id);
            this.showMessage("成功");
        } catch (error) {
            console.error(error);
            if(typeof error === 'string') return this.showMessage(error || "请求失败");
            if(error.status) return this.showMessage("请求失败 HTTP" + error.status);
            this.showMessage(error.message || "请求失败");
        }
    }
}

class TaskStatus {
    constructor() {
        this.element = document.createElement("div");
        this.element.className = 'aria2helper-status'
        this.monitorCount = 0;
    }
    setStatus(task) {
        this.monitorCount ++;
        const statusBox = this.element;
        statusBox.style.display = 'block'
        const completedLength = parseInt(task.completedLength, 10) || 0;
        const totalLength = parseInt(task.totalLength, 10) || 0;
        const downloadSpeed = parseInt(task.downloadSpeed, 10) || 0;
        const uploadLength = parseInt(task.uploadLength, 10) || 0;
        const uploadSpeed = parseInt(task.uploadSpeed, 10) || 0;
        const connections = parseInt(task.connections, 10) || 0;
        const file = task.files[0];
        const filePath = file ? file.path : '';
        const name = filePath.split(/[\/\\]/).pop();
        // 显示扩展名 用于区分当前下载的是种子 还是文件。
        const ext = name.includes(".") ? name.split('.').pop() : '';

        let progress = '-';

        if(totalLength) {
            progress = (completedLength/totalLength * 100).toFixed(2) + '%';
        }

        // ⠓ ⠚ ⠕ ⠪
        const iconList = "⠓⠋⠙⠚".split("");
        const icon = iconList[this.monitorCount % iconList.length];
        let info = [];

        if (task.status === 'active') {
            if (task.verifyIntegrityPending) {
                info.push(`<b>${icon} 🔍 等待验证</b>`);
            } else if (task.verifiedLength) {
                info.push(`<b>${icon} 🔍 正在验证</b>`);
                if (task.verifiedPercent) {
                    info.push(`已验证 (${task.verifiedPercent})`);
                }
            } else if (task.seeder === true || task.seeder === 'true') {
                info.push(`<b>${icon} 📤 做种</b>`);
                info.push(`已上传：${Tool.fileSize(uploadLength)}`);
                info.push(`速度：${Tool.fileSize(uploadSpeed)}/s`);
            } else {
                info.push(`<b>${icon} 📥 下载中</b>`);
                info.push(`进度：${progress}`);
                info.push(`速度：${Tool.fileSize(downloadSpeed)}/s`);
            }
        } else if (task.status === 'waiting') {
            info.push(`<b>${icon} ⏳ 排队</b>`);
        } else if (task.status === 'paused') {
            info.push(`<b>${icon} ⏸ 暂停</b>`);
            info.push(`进度：${progress}`);
        } else if (task.status === 'complete') {
            info.push(`<b>${icon} ☑️ 完成</b>`);
        } else if (task.status === 'error') {
            const errorMessageCN = ARIA2_ERROR_MSG[task.errorCode]
            info.push(`<b>${icon} 错误</b> (${task.errorCode}: ${errorMessageCN || task.errorMessage || "未知错误"})`);
            info.push(`进度：${progress}`);
        } else if (task.status === 'removed') {
            info.push(`<b>${icon} ⛔️ 已删除</b>`);
        }

        info.push(`类型：${ext}`);

        statusBox.innerHTML = info.map(v => `<span>${v}</span>`).join(' ');

        if(task.followedBy && task.followedBy.length) {
            // BT任务跟随
            Tool.setTaskId(GID, task.followedBy[0]);
        }
    }

}

class Tool {


    static htmlDecodeByRegExp (str) {
        let temp = "";
        if(str.length == 0) return "";
        temp = str.replace(/&amp;/g,"&");
        temp = temp.replace(/&lt;/g,"<");
        temp = temp.replace(/&gt;/g,">");
        temp = temp.replace(/&nbsp;/g," ");
        temp = temp.replace(/&#39;/g,"\'");
        temp = temp.replace(/&quot;/g,"\"");
        return temp;
    }

    static addStyle(styles) {
        var styleSheet = document.createElement("style")
        styleSheet.innerText = styles
        document.head.appendChild(styleSheet)
    }

    static urlGetGId(url) {
        let m;
        m = /gid=(\d+)/i.exec(url);
        if(m) return parseInt(m[1], 10);
        m = /archive\/(\d+)\//i.exec(url);
        if(m) return parseInt(m[1], 10);
        m = /\/g\/(\d+)\//i.exec(url);
        if(m) return parseInt(m[1], 10);
    }

    static setTaskId(ehGid, ariaGid) {
        GM_setValue("task-" + ehGid, ariaGid);
    }

    static getTaskId(ehGid) {
        return GM_getValue("task-" + ehGid, 0);
    }

    static fileSize(_size, round = 2) {
        const divider = 1024;

        if (_size < divider) {
          return _size + ' B';
        }

        if (_size < divider * divider && _size % divider === 0) {
          return (_size / divider).toFixed(0) + ' KB';
        }

        if (_size < divider * divider) {
          return `${(_size / divider).toFixed(round)} KB`;
        }

        if (_size < divider * divider * divider && _size % divider === 0) {
          return `${(_size / (divider * divider)).toFixed(0)} MB`;
        }

        if (_size < divider * divider * divider) {
          return `${(_size / divider / divider).toFixed(round)} MB`;
        }

        if (_size < divider * divider * divider * divider && _size % divider === 0) {
          return `${(_size / (divider * divider * divider)).toFixed(0)} GB`;
        }

        if (_size < divider * divider * divider * divider) {
          return `${(_size / divider / divider / divider).toFixed(round)} GB`;
        }

        if (_size < divider * divider * divider * divider * divider &&
          _size % divider === 0) {
          const r = _size / divider / divider / divider / divider;
          return `${r.toFixed(0)} TB`;
        }

        if (_size < divider * divider * divider * divider * divider) {
          const r = _size / divider / divider / divider / divider;
          return `${r.toFixed(round)} TB`;
        }

        if (_size < divider * divider * divider * divider * divider * divider &&
          _size % divider === 0) {
          const r = _size / divider / divider / divider / divider / divider;
          return `${r.toFixed(0)} PB`;
        } else {
          const r = _size / divider / divider / divider / divider / divider;
          return `${r.toFixed(round)} PB`;
        }
    }

}

class MonitorTask {
    constructor() {
        this.gids = [];
        this.taskIds = [];
        this.taskToGid = {};
        this.statusMap = {};
        this.timerId = 0;
        this.run = false;
    }

    start() {
        this.run = true;
        this.refreshTaskIds();
        this.loadStatus();
    }

    stop() {
        this.run = false;
        if(this.timerId)clearTimeout(this.timerId);
    }

    addGid(gid) {
        this.gids.push(gid);
        GM_addValueChangeListener("task-" + gid, () => {
            this.refreshTaskIds();
        });
        this.statusMap[gid] = new TaskStatus();
        return this.statusMap[gid];
    }

    refreshTaskIds() {
        if(!this.gids.length) return;
        this.taskIds = this.gids.map(v => {
            const agid = Tool.getTaskId(v);
            if(agid) this.taskToGid[agid] = v;
            return agid;
        }).filter(v => v);
    }

    async loadStatus() {
        if(!this.run) return;
        let hasActive = false;
        try {
            const batch = await ariaClient.batchTellStatus(this.taskIds);
            batch.forEach(task => {
                this.setStatusToUI(task);
                if(task) hasActive = hasActive || "active" === task.status;
            });
        } catch (error) {
            console.error(error);
        }
        this.timerId = setTimeout(() => {
            this.loadStatus()
        }, hasActive ? 500 : 5000);
    }

    setStatusToUI(task) {
        if(!task) return;
        const gid = this.taskToGid[task.gid];
        if(!gid) return;
        const ui = this.statusMap[gid];
        if(!ui) return;
        ui.setStatus(task);
    }
}

const GID = Tool.urlGetGId(window.location.href);

const ariaClient = new AriaClientLite({rpc: ARIA2_RPC, secret: ARIA2_SECRET, id: ARIA2_CLIENT_ID});

(function() {

    Tool.addStyle(STYLE);

    const monitorTask = new MonitorTask();
    if(GID) {

        // button
        if(IS_TORRENT_PAGE) {
            let tableList = document.querySelectorAll("#torrentinfo form table");
            if(tableList && tableList.length){
                tableList.forEach(function (table) {
                    let insertionPoint = table.querySelector('input');
                    if(!insertionPoint)return;
                    let a = table.querySelector('a');
                    if(!a) return;
                    const link = a.href;
                    const button = new SendTaskButton(GID, link);
                    insertionPoint.parentNode.insertBefore(button.element, insertionPoint);
                });
            }
        }

        if (IS_HATH_ARCHIVE_PAGE) {
            let insertionPoint = document.querySelector("#db a");
            if(!insertionPoint)return;
            const link = insertionPoint.href;
            const button = new SendTaskButton(GID, link);
            button.element.style.marginTop = '16px';
            insertionPoint.parentNode.insertBefore(button.element, insertionPoint);
        }

        // 状态监听
        const taskStatusUi = monitorTask.addGid(GID);
        if (IS_HATH_ARCHIVE_PAGE && USE_HATH_ARCHIVE_TASK_STATUS) {
            taskStatusUi.element.style.marginTop = '8px';
            const insertionPoint = document.querySelector('#db strong');
            if(insertionPoint) insertionPoint.parentElement.insertBefore(taskStatusUi.element, insertionPoint.nextElementSibling);
        }
        if (IS_GALLERY_DETAIL_PAGE && USE_GALLERY_DETAIL_TASK_STATUS) {
            const insertionPoint = document.querySelector('#gd2');
            if(insertionPoint) insertionPoint.appendChild(taskStatusUi.element);
        }
        if (IS_TORRENT_PAGE && USE_TORRENT_TASK_STATUS) {
            const insertionPoint = document.querySelector('#torrentinfo p');
            if(insertionPoint) insertionPoint.parentElement.insertBefore(taskStatusUi.element, insertionPoint.nextElementSibling);
        }
    } else if(USE_LIST_TASK_STATUS) {
        const trList = document.querySelectorAll(".itg tr, .itg .gl1t");
        if(trList && trList.length) {
            const insertionPointMap = {};
            let textAlign = 'left';
            trList.forEach(function (tr) {
                let glname = tr.querySelector(".gl3e, .glname");
                let a = tr.querySelector(".glname a, .gl1e a, .gl1t");
                if(tr.classList.contains('gl1t')) {
                    glname = tr;
                    a = tr.querySelector('a');
                    textAlign = 'center';
                }
                if(!(glname && a)) return;
                const gid = Tool.urlGetGId(a.href);
                insertionPointMap[gid] = glname;
                const statusUI = monitorTask.addGid(gid);
                statusUI.element.style.textAlign = textAlign;
                glname.appendChild(statusUI.element);
            });
        }
    }

    monitorTask.start();

    if(USE_ONE_CLICK_DOWNLOAD) {
        Tool.addStyle(ONE_CLICK_STYLE);
        const trList = document.querySelectorAll(".itg tr, .itg .gl1t");
        if(trList && trList.length) {
            trList.forEach(tr => {
                let a = tr.querySelector(".glname a, .gl1e a, .gl1t");
                if(tr.classList.contains('gl1t')) a = tr.querySelector('a');
                if(!a) return;
                const link = a.href;
                const gid = Tool.urlGetGId(a.href);
                let gldown = tr.querySelector(".gldown");
                gldown.appendChild(oneClickButton(gid, link, null));
            })
        }
        if(IS_GALLERY_DETAIL_PAGE) {
            const gldown = document.querySelector(".g2.gsp");
            const a = document.querySelector(".g2.gsp a");
            const archiverLinkMatch = /'(https:\/\/e.hentai\.org\/archiver\.php?.*?)'/i.exec(a.onclick.toString());
            const archiverLink = Tool.htmlDecodeByRegExp(archiverLinkMatch[1]).replace("--", "-");
            gldown.appendChild(oneClickButton(GID, null, archiverLink));
        }
    }

})();

function oneClickButton(gid, pageLink, archiverLink) {
    const oneClick = document.createElement('div');
    oneClick.textContent = "🡇";
    oneClick.title = "[Aria2] 一键下载";
    oneClick.classList.add("aria2helper-one-click");
    let loading = false;
    oneClick.onclick = async () => {
        if(loading === true) return;
        oneClick.innerHTML = SVG_LOADING_ICON;
        loading = true;
        try {
            if (pageLink && !archiverLink) {
                const g = await fetch(pageLink, { credentials: "include" }).then(v => v.text());
                const archiverLinkMatch = /'(https:\/\/e.hentai\.org\/archiver\.php?.*?)'/i.exec(g);
                archiverLink = Tool.htmlDecodeByRegExp(archiverLinkMatch[1]).replace("--", "-");
            }
            let formData = new FormData();
            formData.append("dltype", ONE_CLICK_DOWNLOAD_DLTYPE);
            formData.append("dlcheck","Download Original Archive");
            const archiverHtml = await fetch(
                archiverLink,
                {method: "POST", credentials: "include", body: formData}
            ).then(v => v.text());
            const downloadLinkMatch = /"(http.*?\.hath.network\/archive.*?)"/i.exec(archiverHtml);
            const downloadLink = downloadLinkMatch[1] + '?start=1';
            const taskId = await ariaClient.addUri(downloadLink);
            Tool.setTaskId(gid, taskId);
            oneClick.innerHTML = "✔";
            setTimeout(() => {
                oneClick.innerHTML = "🡇";
            }, 2000);
        } catch (error) {
            alert("一键下载失败:" + error.message);
            oneClick.innerHTML = "🡇";
        }
        loading = false;
    }
    return oneClick;
}
