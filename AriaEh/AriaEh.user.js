// ==UserScript==
// @name         EhAria2下载助手
// @namespace    com.xioxin.AriaEh
// @version      1.2.1
// @description  发送任务到Aria2,并查看下载进度
// @author       xioxin, SchneeHertz
// @homepage     https://github.com/EhTagTranslation/UserScripts
// @supportURL   https://github.com/EhTagTranslation/UserScripts/issues
// @include      *://exhentai.org/*
// @include      *://e-hentai.org/*
// @include      *hath.network/archive/*
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==


const IS_EX = window.location.host.includes("exhentai");
const gmc = new GM_config({
    'id': 'AriaEhSetting',
    'title': 'AriaEh设置',
    'fields': {
        'ARIA2_RPC': {
            'section': [ 'ARIA2配置', '如果你的下载服务器不是本机,需要的将域名添加到: <br>设置 - XHR 安全 - 用户域名白名单'],
            'label': 'ARIA2_RPC地址<b style="color: red">(必填)</b>',
            'title': 'ARIA2_RPC地址, 例如: http://127.0.0.1:6800/jsonrpc',
            'labelPos': 'left',
            'type': 'text',
            'default': ''
        },
        'ARIA2_SECRET': {
            'label': 'ARIA2_RPC密钥',
            'title': 'ARIA2_RPC密钥',
            'type': 'text',
            'default': ''
        },
        'ARIA2_DIR': {
            'label': '保存文件位置',
            'title': '例如 /Downloads 或者 D:\\Downloads, 留空将下载到默认位置',
            'type': 'text',
            'default': ''
        },
        'USE_ONE_CLICK_DOWNLOAD': {
            'section': [ '一键下载存档', '该功能是将"存档下载"的连接发送给Aria2.在列表页面与详情页增加橙色下载按钮.<b style="color: #f60">注意该功能会产生下载费用!</b>'],
            'labelPos': 'left',
            'label': '启用',
            'title': '在列表页与详情页增加存档一键下载按钮',
            'type': 'checkbox',
            'default': true
        },
        'ONE_CLICK_DOWNLOAD_DLTYPE': {
            'label': '一键下载画质',
            'type': 'select',
            'labelPos': 'left',
            'options': ['org(原始档案)', 'res(重采样档案)'],
            'default': 'org(原始档案)'
        },
        'USE_TORRENT_POP_LIST': {
            'section': [ '种子下载快捷弹窗', '鼠标指向详情页的"种子下载",或者列表的绿色箭头.将显示种子列表浮窗.并高亮最大体积,最新更新.' ],
            'labelPos': 'left',
            'label': '启用',
            'title': '使用种子下载快捷弹窗',
            'type': 'checkbox',
            'default': true
        },
        'REPLACE_EX_TORRENT_URL': {
            'label': '里站使用表站种子连接',
            'title': '替换里站种子域名为ehtracker.org',
            'type': 'checkbox',
            'default': true
        },
        'USE_MAGNET': {
            'label': '使用磁力链替代种子链接',
            'title': '先将种子转换为磁力链，再发送给Aria2',
            'type': 'checkbox',
            'default': false
        },
        'USE_LIST_TASK_STATUS': {
            'section': [ '下载进度展示'],
            'labelPos': 'left',
            'label': '在搜索列表页',
            'title': '在搜索列表页',
            'type': 'checkbox',
            'default': true
        },
        'USE_GALLERY_DETAIL_TASK_STATUS': {
            'label': '在画廊详情页',
            'title': '在画廊详情页',
            'type': 'checkbox',
            'default': true
        },
        'USE_HATH_ARCHIVE_TASK_STATUS': {
            'label': '在存档下载页面',
            'title': '在存档下载页面',
            'type': 'checkbox',
            'default': true
        },
        'USE_TORRENT_TASK_STATUS': {
            'label': '在种子下载页面',
            'title': '在种子下载页面',
            'type': 'checkbox',
            'default': true
        },
        'INITIALIZED': {
            'type': 'hidden',
            'default': false,
        }
    },
    'events': {
        'init': onConfigInit
    },
    css: `
    #AriaEhSetting { background: #E3E0D1; }
    #AriaEhSetting .config_header { margin-bottom: 8px; }
    #AriaEhSetting .section_header { font-size: 12pt; }
    #AriaEhSetting .section_header_holder { margin-top: 16pt; }
    #AriaEhSetting input, #AriaEhSetting select { background:#E3E0D1; border: 2px solid #B5A4A4; border-radius: 3px; }
    #AriaEhSetting .field_label { display: inline-block; min-width: 150px; text-align: right;}
    ${IS_EX ? `
    #AriaEhSetting { background:#4f535b; color: #FFF; }
    #AriaEhSetting .section_header { border: 1px solid #000;  }
    #AriaEhSetting .section_desc { background:#34353b; border: 1px solid #000; color: #CCC; }
    #AriaEhSetting input, #AriaEhSetting select { background:#34353b; color: #FFF; border: 2px solid #8d8d8d; border-radius: 3px; }
    #AriaEhSetting_resetLink { color: #FFF; }
    `: ''}
    `
})
console.log('gmc', gmc);

function onConfigInit() {
    // 如果没有配置地址, 在首页弹出配置页面
    if((!gmc.get('ARIA2_RPC')) && window.location.pathname == '/') {
        gmc.open();
        AriaEhSetting.style = iframeCss
        throw new Error("未设置ARIA2_RPC地址");
    }
    init()
}

const iframeCss = `
    width: 400px;
    height: 480px;
    border: 1px solid;
    border-radius: 4px;
    position: fixed;
    z-index: 9999;
`

GM_registerMenuCommand("设置", () => {
    gmc.open()
    AriaEhSetting.style = iframeCss
})


let ARIA2_CLIENT_ID = GM_getValue('ARIA2_CLIENT_ID', '');
if (!ARIA2_CLIENT_ID) {
    ARIA2_CLIENT_ID = "EH-" + new Date().getTime();
    GM_setValue("ARIA2_CLIENT_ID", ARIA2_CLIENT_ID);
}

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
    background: radial-gradient(#ffc36b,#c56a00);
    border-radius: 15px;
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
.aria2helper-one-click.bt {
    background: radial-gradient(#a2d04f,#5fb213);
}
.aria2helper-one-click.bt:hover {
    background: radial-gradient(#95cf2b,#427711);
}
.aria2helper-one-click i {
    font-style: initial;
    transform: scale(0.7);
    margin-left: -1.5px;
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

#gd5 .g2 {
    position: relative;
}
#btList{
    display: none;
    background: #f00;
    width: 90%;
    position: absolute;
    border-radius: 4px;
    border: 1px;
    z-index: 999;
    padding: 8px 0;
    font-size: 12px;
    text-align: left;
    background: rgba(${IS_EX ? '0,0,0': '255,255,255'}, 0.6);
    border-radius: 4px;
    font-weight: normal;
    white-space: normal;
    box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
    backdrop-filter: saturate(180%) blur(20px);
    font-size: 12px;
    width: max-content;
    margin-top: 8px;
}
.nowrap {
    white-space:nowrap;
}
#gmid #btList {
    right: 0;
    margin-top: 16px;
}
.gldown #btList{
    left: 0;
}
.gldown #btList table {
    max-width: 60vw;
}
.btListShow #btList{
    display: block;
}
#btList .bt-item {
    padding: 4px 8px;
}
#btList .bt-name {
    font-weight: bold;
}
#btList .quality {
    font-weight: bold;
}
#btList td span {
    display: inline-block;
    padding: 2px 4px;
    height: 16px;
    line-height: 16px;
}
#btList td span.quality {
    font-weight: bold;
    border-radius: 4px;
    background: ${IS_EX ? '#fff': '#5c0d12'};
    color:  ${IS_EX ? '#000': '#fff'};
}
#btList table {
    border-spacing:0;
    border-collapse:collapse;
    max-width: 80vw;
}
#btList tr th {
    padding-bottom: 8px;
    text-align: center;
}
#btList tr th span {
    font-weight: 400;
}
#btList tr td {
    padding: 2px 4px;
}
#btList tr:hover td {
    background: rgba(${IS_EX ? '0,0,0': '255,255,255'}, 0.6);
}
#btList tr>td:first-of-type, #btList tr>th:first-of-type {
    padding: 0 8px;
}
#btList tr>td:last-child, #btList tr>th:last-child {
    padding-right: 8px;
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
        if(dir) opt['dir'] = dir;
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
            const id = await ariaClient.addUri(getTorrentLink(this.link), gmc.get('ARIA2_DIR'));
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

    static urlGetToken(url) {
        let m;
        m = /&t(oken)?=(\d+)/i.exec(url);
        if(m) return m[2];
        m = /\/g\/(\d+)\/(\w+)\//i.exec(url);
        if(m) return m[2];
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
const TOKEN = Tool.urlGetToken(window.location.href);

let ariaClient;

console.log({GID, TOKEN});


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
                if (!archiverLinkMatch) throw new Error("未找到存档页面链接");
                archiverLink = Tool.htmlDecodeByRegExp(archiverLinkMatch[1]).replace("--", "-");
            }
            const formData = new URLSearchParams();
            formData.append("dltype", gmc.get('ONE_CLICK_DOWNLOAD_DLTYPE').slice(0, 3));
            formData.append("dlcheck","Download Original Archive");
            const response = await fetch(
                archiverLink,
                {method: "POST", credentials: "include", body: formData}
            );
            if (!response.ok) throw new Error(`存档请求失败 HTTP ${response.status}`);
            const archiverHtml = await response.text();
            const downloadLinkMatch = /"(http.*?\.hath.network\/archive.*?)"/i.exec(archiverHtml);
            if (!downloadLinkMatch) throw new Error("存档页面未返回下载链接，请打开存档下载页面查看详情");
            const downloadLink = downloadLinkMatch[1] + '?start=1';
            const taskId = await ariaClient.addUri(downloadLink, gmc.get('ARIA2_DIR'));
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


async function getTorrentList(gid, token, lifeTime = 0) {
    const html = await fetch(`${document.location.origin}/gallerytorrents.php?gid=${gid}&t=${token}`, {credentials: "include"}).then(v => v.text());
    const safeHtml = html.replace(/^.*<body>(.*)<\/body>.*$/igms,"$1").replace(/<script.*?>(.*?)<\/script>/igms, '');
    const dom = document.createElement('div')
    dom.innerHTML = safeHtml;
    const formList = [...dom.querySelectorAll("form")];
    const list = formList.map((e, i) => {
        const link = e.querySelector("table > tbody > tr:nth-child(3) > td > a");
        if(!link) return null;
        const posted = e.querySelector("table > tbody > tr:nth-child(1) > td:nth-child(1)");
        const size = e.querySelector("table > tbody > tr:nth-child(1) > td:nth-child(2)");
        const seeds = e.querySelector("table > tbody > tr:nth-child(1) > td:nth-child(4)");
        const peers = e.querySelector("table > tbody > tr:nth-child(1) > td:nth-child(5)");
        const downloads = e.querySelector("table > tbody > tr:nth-child(1) > td:nth-child(6)");
        const uploader = e.querySelector("table > tbody > tr:nth-child(2) > td:nth-child(1)");
        const getNumber = (text = '') => parseFloat((text.match(/[\d\.]+/) || [0])[0]);
        const getValueText = (text = '') => (text.match(/:(.*)/) || ['',''])[1].trim();
        const sizeText = getValueText(size.textContent);
        const sizeNumber = getNumber(sizeText);
        const unit = [sizeText.match(/[KMGT]i?B/) || ['']][0];
        const magnification = {
            "KB": 1000,
            "MB": 1000 * 1000,
            "GB": 1000 * 1000 * 1000,
            "TB": 1000 * 1000 * 1000 * 1000,
            "KiB": 1024,
            "MiB": 1024 * 1024,
            "GiB": 1024 * 1024 * 1024,
            "TiB": 1024 * 1024 * 1024 * 1024,
        }
        if(!magnification[unit]) {
            console.warn("未知单位: ", unit, size);
        }
        let bytes = magnification[unit] ? sizeNumber * magnification[unit] : -1;
        const time = new Date(getValueText(posted.textContent));
        return {
            index: i,
            time: time,
            readableTime: dateStr(time),
            size: sizeText,
            bytes: bytes,
            seeds: getNumber(seeds.textContent), // 做种
            peers: getNumber(peers.textContent), // 下载中
            downloads: getNumber(downloads.textContent), // 完成
            user: getValueText(uploader.textContent),
            name: link.textContent,
            link: link.getAttribute('href'),
            achievements: new Set(),
        }
    }).filter(v => v);

    let maxBytes = 0;
    let maxTime = 0;
    let maxSeeds = 0;
    let maxPeers = 0;
    let maxDownloads = 0;
    list.forEach(v => {
        maxBytes = Math.max(maxBytes, v.bytes);
        maxTime = Math.max(maxTime, v.time.getTime());
        maxSeeds = Math.max(maxSeeds, v.seeds);
        maxPeers = Math.max(maxPeers, v.peers);
        maxDownloads = Math.max(maxDownloads, v.downloads);
    });
    list.forEach(v => {
        const time = v.time.getTime();
        if(v.bytes == maxBytes) v.achievements.add("size");
        if(time == maxTime) v.achievements.add("time");
        if(v.seeds == maxSeeds && maxSeeds > 0) v.achievements.add("seeds");
        if(v.peers == maxPeers && maxPeers > 0) v.achievements.add("peers");
        if(v.downloads == maxDownloads && maxDownloads > 0) v.achievements.add("downloads");
        if(time < lifeTime) v.achievements.add("overdue");
    });

    list.sort((a,b) => {
        return b.time.getTime() - a.time.getTime();
    })

    console.log('list', list);
    return list;
}

function dateStr(date = new Date()){
    const today = new Date();
    const now = today.getTime();
    const time = Math.floor((now - date.getTime())/1000) + ( today.getTimezoneOffset() * 60);
    if(time <= 60){
        return '刚刚';
    }else if(time<=60*60){
        return Math.floor(time/60)+"分钟前";
    }else if(time<=60*60*24){
        return  Math.floor(time/60/60)+"小时前";
    }else if(time<=60*60*24*7) {
        return Math.floor(time/60/60/24) + "天前";
    }else if(time<=60*60*24*7*4) {
        return Math.floor(time/60/60/24/7) + "周前";
    }else if(time<=60*60*24*365) {
        return (date.getMonth()+1).toString().padStart(2, '0')+"月"+date.getDate().toString().padStart(2, '0')+"日"
    }
    return date.getFullYear()+'年';
}

async function torrentsPopDetail(btButtonBox, gid = GID, token = TOKEN, buttonLeft = false, twoLines = false) {
    if(!btButtonBox) {
        btButtonBox = document.querySelector('#gd5 .g2:nth-child(3)');
    }
    if(btButtonBox) {
        boxA = btButtonBox.querySelector('a');
        boxA.onmouseenter = async () => {
            let btListBox = btButtonBox.querySelector('#btList');
            btButtonBox.classList.add('btListShow');
            if(!btListBox) {
                btListBox = document.createElement("div");
                btListBox.id = 'btList';
                btButtonBox.appendChild(btListBox);
                btListBox.innerHTML = SVG_LOADING_ICON;
                try {
                    const torents = await getTorrentList(gid, token);
                    if(torents.length) {
                        const achievement = (item, name) => item.achievements.has(name) ? 'quality' : '';
                        let th = '';
                        if(twoLines) {
                            th = `
                            <th>名称</th>
                            <th>体积</th>
                            <th>时间</th>
                            <th><span title="正在做种 Seeds">📤</span></th>
                            <th><span title="正在下载 Peers">📥</span></th>
                            <th><span title="下载完成 Downloads">✔️</span></th>`;
                        }else {
                            th = `
                            ${buttonLeft ? "<th></th><th></th>" : ""}
                            <th>名称</th>
                            <th>体积</th>
                            <th>时间</th>
                            <th><span title="正在做种 Seeds">📤</span></th>
                            <th><span title="正在下载 Peers">📥</span></th>
                            <th><span title="下载完成 Downloads">✔️</span></th>`;
                        }


                        btListBox.innerHTML = `<table>
                        <tr>
                        ${th}
                        </tr>
                        ${
                            torents.map(item => {

                                const button1 = `<td class="bt-button nowrap"><div data-link="${item.link}" data-gid="${gid}" class="aria2helper-one-click bt-download-button bt ">🡇</div></td>`;
                                const button2 = `<td class="bt-button nowrap"><div data-link="${item.link}" data-gid="${gid}" class="aria2helper-one-click bt-copy-button icon bt ">✂</div></td>`;
                                    const nameHtml = `<td class="bt-name"><a href="${item.link}">${item.name}</a></td>`;
                                    const infoHtml = `<td class="bt-size nowrap"><span class="${achievement(item, 'size')}">${item.size}</span></td>
                                    <td class="bt-time nowrap"><span title="${item.time.toLocaleString()}" class="${achievement(item, 'time')}">${item.readableTime}</span></td>
                                    <td class="bt-seeds nowrap"><span class="${achievement(item, 'seeds')}">${item.seeds}</span></td>
                                    <td class="bt-peers nowrap"><span class="${achievement(item, 'peers')}">${item.peers}</span></td>
                                    <td class="bt-downloads nowrap"><span class="${achievement(item, 'downloads')}">${item.downloads}</span></td>`;
                                    if(twoLines) {
                                        return `
                                <tr class="bt-item no-hover">
                                    ${nameHtml}
                                </tr>
                                <tr class="bt-item">
                                    ${button1 + button2}
                                    ${infoHtml}
                                </tr>
                                `;
                                    }
                                return `
                                <tr class="bt-item">
                                    ${buttonLeft ? button1 + button2 : ''}
                                    ${nameHtml}
                                    ${infoHtml}
                                    ${buttonLeft ? '' :  button2 + button1 }
                                </tr>
                                `
                            }).join('')
                        }</table>`;

                        btListBox.onclick = async (event) => {
                            if(event.target.classList.contains("bt-download-button")) {
                                const link = event.target.dataset.link;
                                const gid = parseInt(event.target.dataset.gid, 10);
                                if(event.target.dataset.loading === true) return;
                                event.target.innerHTML = SVG_LOADING_ICON;
                                event.target.dataset.loading = true;
                                try {
                                    const taskId = await ariaClient.addUri(getTorrentLink(link), gmc.get('ARIA2_DIR'));
                                    Tool.setTaskId(gid, taskId);
                                    event.target.innerHTML = "✔";
                                    setTimeout(() => {
                                        event.target.innerHTML = "🡇";
                                    }, 2000);
                                } catch (error) {
                                    alert("一键下载失败:" + error.message);
                                    event.target.innerHTML = "🡇";
                                }
                                event.target.dataset.loading = false;
                            }
                            if(event.target.classList.contains("bt-copy-button") || event.target.parentNode.contains("bt-copy-button")) {
                                const link = event.target.dataset.link;
                                const magnet = torrentLink2magnet(link);
                                if (magnet) {
                                    GM_setClipboard(magnet);
                                    event.target.innerHTML = "✔";
                                    setTimeout(() => {
                                        event.target.innerHTML = "✂";
                                    }, 2000);
                                }
                            }

                        }
                    }else {
                        btListBox.innerHTML = "没有可用种子"
                    }
                } catch (error) {
                    btListBox.innerHTML = error.message;
                }
            }
        }
        btButtonBox.onmouseleave = () => {
            btButtonBox.classList.remove('btListShow');
        }
    }
}

function getTorrentInfo(link) {
    let match = link.match(/\/(\d+)\/([0-9a-f]{40})/i);
    if(!match) return;
    return {
        hash: match[2],
        trackerId: match[1],
    }
}

function torrentLink2magnet (link) {
    const info = getTorrentInfo(link);
    if(!info) return;
    return `magnet:?xt=urn:btih:${info.hash}&tr=${encodeURIComponent(`http://ehtracker.org/${info.trackerId}/announce`)}`;
}

function torrentLinkForceEhTracker (link) {
    const info = getTorrentInfo(link);
    if(!info) return;
    return `https://ehtracker.org/get/${info.trackerId}/${info.hash}.torrent`;
}

function getTorrentLink(link) {
    if(gmc.get('USE_MAGNET')) {
        return torrentLink2magnet(link) || link;
    }
    if(link.includes('exhentai.org') && gmc.get('REPLACE_EX_TORRENT_URL')) {
        return torrentLinkForceEhTracker(link) || link;
    }
    return link;
}


function init() {
    ariaClient = new AriaClientLite({rpc: gmc.get('ARIA2_RPC'), secret: gmc.get('ARIA2_SECRET'), id: ARIA2_CLIENT_ID});
    Tool.addStyle(STYLE);

    const monitorTask = new MonitorTask();
    if(GID) {

        // button
        if(IS_TORRENT_PAGE) {
            let tableList = document.querySelectorAll("#torrentinfo form table");
            if(tableList && tableList.length){
                tableList.forEach(function (table) {
                    let insertionPoint = table.querySelector('input[type="submit"],button[type="submit"]');
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
        if (IS_HATH_ARCHIVE_PAGE && gmc.get('USE_HATH_ARCHIVE_TASK_STATUS')) {
            taskStatusUi.element.style.marginTop = '8px';
            const insertionPoint = document.querySelector('#db strong');
            if(insertionPoint) insertionPoint.parentElement.insertBefore(taskStatusUi.element, insertionPoint.nextElementSibling);
        }
        if (IS_GALLERY_DETAIL_PAGE && gmc.get('USE_GALLERY_DETAIL_TASK_STATUS')) {
            const insertionPoint = document.querySelector('#gd2');
            if(insertionPoint) insertionPoint.appendChild(taskStatusUi.element);
        }
        if (IS_TORRENT_PAGE && gmc.get('USE_TORRENT_TASK_STATUS')) {
            const insertionPoint = document.querySelector('#torrentinfo p');
            if(insertionPoint) insertionPoint.parentElement.insertBefore(taskStatusUi.element, insertionPoint.nextElementSibling);
        }
        if(IS_GALLERY_DETAIL_PAGE && gmc.get('USE_TORRENT_POP_LIST')) {
            torrentsPopDetail();
        }
    } else if(gmc.get('USE_LIST_TASK_STATUS')) {
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
                const token = Tool.urlGetToken(a.href);
                insertionPointMap[gid] = glname;
                const statusUI = monitorTask.addGid(gid);
                statusUI.element.style.textAlign = textAlign;
                glname.appendChild(statusUI.element);

                const listTypeDom = document.querySelector("#dms select > option[selected]");
                const listType = listTypeDom ? listTypeDom.value : '';
                if(listType == 't') return; // 暂时不支持缩略图模式,显示问题
                const gldown = tr.querySelector(".gldown");
                const torrentImg = gldown.querySelector('img');
                const torrentImgSrc = torrentImg.attributes.getNamedItem('src').value
                const hasTorrent = torrentImgSrc.includes("g/t.png");
                if(gmc.get('USE_TORRENT_POP_LIST') && hasTorrent) {
                    torrentsPopDetail(gldown, gid, token, true, listType == 't');
                }
            });
        }
    }


    monitorTask.start();

    if(gmc.get('USE_ONE_CLICK_DOWNLOAD')) {
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

}
