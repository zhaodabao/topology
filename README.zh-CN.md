# Topology

[English](./README.md)

## 网络拓扑
网络拓扑是指由网络节点设备和通信介质构成的网络结构图(来自百度百科).

## 项目简介
这个Repository提供的网络拓扑, 是一套完整可用的面向电信级/企业级用户的HTML5网络拓扑图方案. 图形是基于SVG绘制的, 同时配备了一系列UI套件, 使您更直观的了解Topology是如何工作的. 

Topology其实是在2013年开发的, 需要说明的是, 在GitHub上的这个Topology是一个**简单的示例**, 原因是: 首先我只保留了前端部分(服务端是很次要的); 其次完整的Topology涵盖了很多的图形化解决方案(如业务影响性&关联性,VPN虚拟专用网,云环境虚拟化资源网等), 只有简化才能更好的聚焦在技术上.

## 效果预览
主界面截图  
![主界面截图](./images/preview/preview1.png "主界面")  

编辑界面截图  
![编辑界面截图](./images/preview/preview2.png "编辑页面")  

移动端 (iOS Safari)  
![移动端](./images/preview/mobile.png "移动端 (iOS Safari)")

## 在线示例
在示例页面打开后将会加载资源, 请您耐心等待. 推荐使用Google Chrome浏览器观看.  
[在线示例](https://zhaodabao.github.io/topology/main.html?type=1)

## 指南
1. 因为文件较多, 所以建议下载ZIP(4.9M)并解压缩查看.
2. 打开根目录下的main.html即可浏览.
3. 名字为***blank***的视图可以让您体验图形编辑功能.
4. 更多的功能说明将逐步补充:)

## 特性
* 完全矢量化, 缩放不失真
* 与MS Visio相似的绘图体验
* 所见即所得的图形定制
* 支持导出为PNG或JPG格式的位图, 或导出为PDF格式的矢量图(需要服务端Java)
* 支持快捷键操作
* 支持鹰眼

## 浏览器兼容性
浏览器 | 细节
------------ | -------------
Google Chrome | 45+, 推荐.
Firefox | 43+
Internet Explorer | 6.0 - 8.0 需要安装 Adobe SvgViewer; 9.0 不支持滤镜; 10.0+ 部分支持变形、滤镜等; 所有版本的IE均不支持 SMIL 动画. 不推荐使用.
Opera | 34+
Safari | 9+
iOS Safari | 8.4+
Android Chrome | 47+

## 计划列表
* 撤销和重做
* 支持移动端操作和响应式UI
* 对折线的编辑做增强
* 增加更多图形渲染效果, 如发光高亮
* Bootstrap风格引入
* 逐步发布源代码文件
* 让它做更多! 如UML图, 流程图, 等等

## 作者
[@zhaodabao](https://github.com/zhaodabao)  
[@wangzhenhua](https://github.com/wangzhenhua1020)  
[@luqin](https://github.com/luqin)

## 协议 License
Topology 基于 GPL 协议发布.
