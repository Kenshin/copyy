console.log( "=== copyy background load ===" )

chrome.contextMenus.create({
    "id"   : "copyy",
    "title": "CopyY",
    "contexts" : [ "all" ],
});

chrome.contextMenus.create({
    "id"       : "link2md",
    "parentId" : "copyy",
    "title"    : "复制为 Markdown",
    "contexts" : [ "link" ],
});

chrome.contextMenus.create({
    "id"       : "global2txt",
    "parentId" : "copyy",
    "title"    : "复制为 标题 + 链接",
    "contexts" : [ "page" ],
});

chrome.contextMenus.create({
    "id"       : "global2md",
    "parentId" : "copyy",
    "title"    : "复制为 Markdown",
    "contexts" : [ "page" ],
});

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