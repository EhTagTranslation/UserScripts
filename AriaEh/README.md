EhAria2下载助手
-------------------------------------

[安装脚本](https://sleazyfork.org/zh-CN/scripts/432210-eharia2%E4%B8%8B%E8%BD%BD%E5%8A%A9%E6%89%8B)

* 增加Aria2快捷下载按钮
* 在页面中直接查看Aria2下载进度与状态 (列表页面、详情页面、种子页面、存档下载页面)
* 一键下载功能 (存档下载, 注意会消耗配额或GP点数)
* 种子快捷查看,鼠标指向种子下载按钮列出所有种子,并标注出体积最大最新的种子. 方便下载.
  * 复制磁力链会增加Tracker地址
  * 点击名字下载种子
  * 点击下载按钮发送任务到Aria2

## 已知问题
* 一键下载功能无法正确下载，下载后无文件名
  * 情况1：E站的归档设置，需要设置为“手动选择，手动下载（默认）”（目前没有精力适配其他模式，欢迎PR）[#6](https://github.com/EhTagTranslation/UserScripts/issues/6#issuecomment-1214385546)
  * 情况2：开启aria2配置中的 “获取服务器文件时间” 和 “使用UTF-8处理Content-Disposition” [#6](https://github.com/EhTagTranslation/UserScripts/issues/6#issuecomment-1214412506)

## 预览

### 列表页面下载状态与一键下载
![GIF](https://user-images.githubusercontent.com/5716100/132883089-d375791f-7865-4645-94ca-5a2f4dbe5327.gif)

![GIF](https://user-images.githubusercontent.com/5716100/132880948-41e3a88b-e340-424b-867c-4396dede4893.gif)

### 详情页下载状态与一键下载
![image](https://user-images.githubusercontent.com/5716100/132881993-61abdd70-7155-4285-b322-5754bd7cd71c.png)

### 种子页面
![image](https://user-images.githubusercontent.com/5716100/132882237-8238973f-88c3-4d99-858a-7b4105eaa76f.png)

### 存档下载页面
![image](https://user-images.githubusercontent.com/5716100/132882324-2ea8e27d-1c1c-488a-bf38-d0b08657e0e0.png)

### 种子快捷查看

<img width="644" alt="3dc2b9b7c608841ef4a1db2dd336368" src="https://user-images.githubusercontent.com/5716100/142731836-04d2e1df-f98b-4a4b-aaa2-db859fbd1185.png">
<img width="986" alt="b7e060ef6da4803371c21ff03b41066" src="https://user-images.githubusercontent.com/5716100/142731839-ef9d8042-4048-4ae2-bb88-dd87406571be.png">
