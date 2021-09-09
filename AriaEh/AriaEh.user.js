// ==UserScript==
// @name         ehAria2助手
// @namespace    com.xioxin.AriaEh
// @version      0.1
// @description  发送任务到Aria2,并查看下载进度
// @author       xioxin
// @include     *://exhentai.org/gallerytorrents.php*
// @include     *://e-hentai.org/gallerytorrents.php*
// @include     *://exhentai.org/g/*
// @include     *://e-hentai.org/g/*
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

// 你可以直接在这里修改配置
// 如果你的下载服务器不是本机,将需要的域名添加到: 设置 - XHR 安全 - 用户域名白名单
let ARIA2_RPC = "http://127.0.0.1:6800/jsonrpc"; // ARIA2地址
let ARIA2_SECRET = ""; // 密钥
let ARIA2_DIR = ""; // 保存文件位置

// 本地保存的配置
ARIA2_RPC = GM_getValue('ARIA2_RPC', ARIA2_RPC);
ARIA2_SECRET = GM_getValue('ARIA2_SECRET', ARIA2_SECRET);
ARIA2_DIR = GM_getValue('ARIA2_DIR', ARIA2_DIR);

let ARIA2_CLIENT_ID = GM_getValue('ARIA2_CLIENT_ID', '');
if(!ARIA2_CLIENT_ID) {
    ARIA2_CLIENT_ID = "EH-" + new Date().getTime();
    GM_setValue("ARIA2_CLIENT_ID", ARIA2_CLIENT_ID);
}

console.log({ARIA2_RPC, ARIA2_SECRET, ARIA2_DIR})

function addStyle(styles) {
    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
}

addStyle(`
.aria2helper-box {
    height: 27px;
    line-height: 27px;
}
.aria2helper-button { }
.aria2helper-loading { }
.aria2helper-message { cursor: pointer;  }
.aria2helper-status { text-align: center; }
`);


const IS_EX = window.location.host.indexOf("exhentai") != -1;

const SVG_LOADING_ICON = `<svg style="margin: auto; display: block; shape-rendering: auto;" width="24px" height="24px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
<circle cx="50" cy="50" fill="none" stroke="${IS_EX ? '#f1f1f1': '#5C0D11'}" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
  <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
</circle></svg>`;

function request(url, opt={}) {
	Object.assign(opt, {
		url,
		timeout: 2000,
		responseType: 'json'
	})
	return new Promise((resolve, reject) => {
		opt.onerror = opt.ontimeout = reject
		opt.onload = resolve
		GM_xmlhttpRequest(opt)
	})
}

async function addUri(url) {
    const params = [];
    if(ARIA2_SECRET) params.push("token:" + ARIA2_SECRET);
    params.push(...[ [url], {"follow-torrent": 'true'} ]);
    const response = await request(ARIA2_RPC, {
        method: "POST",
        data: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "aria2.addUri",
            "id": ARIA2_CLIENT_ID,
            params
        })
    });
    return aria2ResponseGuard(response);
}

async function tellStatus(id) {
    const params = [];
    if(ARIA2_SECRET) params.push("token:" + ARIA2_SECRET);
    params.push(id);
    const response = await request(ARIA2_RPC, {
        method: "POST",
        data: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "aria2.tellStatus",
            "id": ARIA2_CLIENT_ID,
            params
        })
    });
    return aria2ResponseGuard(response);
}

function aria2ResponseGuard(response) {
    if(response.responseType !== 'json') {
        throw `不支持的数据格式: ${response.status}`;
    }
    const json = JSON.parse(response.responseText);
    if(response.status !== 200 && json && json.error) throw `${json.error.code} ${json.error.message}`;
    if(response.status !== 200) throw `错误: ${response.status}`;
    return json.result;
}

function urlGetGId(url) {
    let m;
    m = /gid=(\d+)/i.exec(url);
    if(m) return parseInt(m[1], 10);
    m = /archive\/(\d+)\//i.exec(url);
    if(m) return parseInt(m[1], 10);
    m = /\/g\/(\d+)\//i.exec(url);
    if(m) return parseInt(m[1], 10);
}

const GID = urlGetGId(window.location.href);

function saveTaskIdBind(ehGid, ariaGid) {
    GM_setValue("task-" + ehGid, ariaGid);
}

function getAriaGidByEhGid(ehGid) {
    return GM_getValue("task-" + ehGid, 0);
}

console.log("GID", GID);

(function() {
    if(!GID) return;
    let tableList = document.querySelectorAll("#torrentinfo form table");
    if(tableList && tableList.length)tableList.forEach(function (table) {
        let insertionPoint = table.querySelector('input');
        if(!insertionPoint)return;

        let a = table.querySelector('a');
        if(a)href = a.href;

        const box = document.createElement("div");
        box.className = "aria2helper-box";

        const loading = document.createElement("div");
        loading.className = "aria2helper-loading";
        loading.innerHTML = SVG_LOADING_ICON;

        const message = document.createElement("div");
        message.className = "aria2helper-message";


        var button = document.createElement("input");
        button.type = "button";
        button.value = "发送到Aria2";
        button.className = 'stdbtn aria2helper-button';
        box.appendChild(button);
        box.appendChild(loading);
        box.appendChild(message);
        insertionPoint.parentNode.insertBefore(box, insertionPoint);

        function show(node) {
            console.log('show', node);
            loading.style.display = 'none';
            message.style.display = 'none';
            button.style.display = 'none';
            node.style.display = '';
        }
        show(button);

        button.onclick = async () => {
            show(loading);
            try {
                const id = await addUri(href);
                saveTaskIdBind(GID, id);
                message.textContent = "成功";
                show(message);
            } catch (error) {
                if(typeof error === 'string') {
                    message.textContent = error || "请求失败";
                }else {
                    if(error.status) {
                        message.textContent = "请求失败 HTTP" + error.status;
                    } else {
                        message.textContent = error.message || "请求失败";
                    }
                }
                show(message);
                console.error(error);
            }
        };

        message.onclick = () => {
            show(button);
        };
    })
})();


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


function taskStatus (task) {
    if (!task) {
        return '';
    }
    if (task.status === 'active') {
        if (task.verifyIntegrityPending) {
            return '等待验证';
        } else if (task.verifiedLength) {
            if(task.verifiedPercent) {
                return `正在验证 (${task.verifiedPercent})`;
            }
            return "正在验证";
        } else if (task.seeder === true || task.seeder === 'true') {
            return '做种';
        } else {
            return '下载中';
        }
    } else if (task.status === 'waiting') {
        return '排队';
    } else if (task.status === 'paused') {
        return '暂停';
    } else if (task.status === 'complete') {
        return '下载完成';
    } else if (task.status === 'error') {
        const errorMessageCN = ARIA2_ERROR_MSG[task.errorCode]
        return `错误 (${task.errorCode}: ${errorMessageCN || task.errorMessage || "发生错误"})`
    } else if (task.status === 'removed') {
        return '已删除';
    } else {
        return '';
    }
}

// 监听进度
(function() {
    if(!GID) return;

    const statusBox = document.createElement("div");
    statusBox.className = 'aria2helper-status'

    let insertionPoint1 = document.querySelector('#torrentinfo p');
    if(insertionPoint1) insertionPoint1.parentElement.insertBefore(statusBox, insertionPoint1.nextElementSibling);

    let insertionPoint2 = document.querySelector('#gd2');
    if(insertionPoint2) insertionPoint2.appendChild(statusBox);

    statusBox.textContent = "";

    let monitorId = 0;

    const monitorTaskProgress = async () => {
        const thisMonitorId = monitorId;
        const ariaGid = getAriaGidByEhGid(GID);
        console.log("ariaGid", ariaGid);
        if(!ariaGid) return;
        const data = await tellStatus(ariaGid);
        console.log("tellStatus", data);

        const completedLength = parseInt(data.completedLength, 10) || 0;
        const totalLength = parseInt(data.totalLength, 10) || 0;
        const downloadSpeed = parseInt(data.downloadSpeed, 10) || 0;
        const errorCode = parseInt(data.errorCode, 10) || 0;
        const errorMessage = data.errorMessage || '';
        const statusStr = taskStatus(data);

        let progress = '-';
        if(totalLength) {
            progress = (completedLength/totalLength * 100).toFixed(2) + '%';
        }

        statusBox.textContent = `[Aria2] ${statusStr} 进度: ${progress} 速度: ${downloadSpeed}`;

        if(data.followedBy && data.followedBy.length) {
            // BT任务跟随
            saveTaskIdBind(GID, data.followedBy[0]);
        }
        if(thisMonitorId == monitorId) setTimeout(monitorTaskProgress, 500);
    }

    console.log("getAriaGidByEhGid(GID)", getAriaGidByEhGid(GID));
    if(getAriaGidByEhGid(GID)) {
        monitorId++;
        console.log('原来就有', getAriaGidByEhGid(GID));
        monitorTaskProgress()
    }
    GM_addValueChangeListener("task-" + GID, (name, oldValue, newValue) => {
        monitorId++;
        console.log(arguments);
        monitorTaskProgress();
    });

})();

// 翻译: 'The file was successfully prepared, and is ready for download.'
// 'The file was successfully prepared, and is ready for download.'
// 'You can also copy this link to a download manager.'
