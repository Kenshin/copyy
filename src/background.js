console.log( "=== copyy background load ===" )

/***********************
 * Root menu
 ***********************/

chrome.contextMenus.create({
    "id"   : "copyy",
    "title": "CopyY",
    "contexts" : [ "all" ],
});

/***********************
 * Link menu
 ***********************/

chrome.contextMenus.create({
    "id"       : "link2md",
    "parentId" : "copyy",
    "title"    : "复制为 Markdown",
    "contexts" : [ "link" ],
});

/***********************
 * Page menu
 ***********************/

chrome.contextMenus.create({
    "id"       : "global2txt",
    "parentId" : "copyy",
    "title"    : "复制 标题 + 链接 为文本",
    "contexts" : [ "page" ],
});

chrome.contextMenus.create({
    "id"       : "global2md",
    "parentId" : "copyy",
    "title"    : "复制 标题 + 链接 为MD格式",
    "contexts" : [ "page" ],
});

chrome.contextMenus.create({
    "id"       : "selected2png",
    "parentId" : "copyy",
    "title"    : "复制选中内容为 PNG",
    "contexts" : [ "page" ],
});

chrome.contextMenus.create({
    "id"       : "selected2md",
    "parentId" : "copyy",
    "title"    : "复制选中内容为 Markdown",
    "contexts" : [ "page" ],
});

/***********************
 * Image menu
 ***********************/

chrome.contextMenus.create({
    "id"       : "img2base64",
    "parentId" : "copyy",
    "title"    : "复制为 Base64",
    "contexts" : [ "image" ],
});

chrome.contextMenus.create({
    "id"       : "img2md",
    "parentId" : "copyy",
    "title"    : "复制为 Markdown",
    "contexts" : [ "image" ],
});

chrome.contextMenus.onClicked.addListener( function( info, tab ) {
    console.log( info, tab )
    chrome.tabs.sendMessage(tab.id, { type: info.menuItemId, content: info });
});