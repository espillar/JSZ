/**
 * JSZ4 - Client-side Zettelkasten Core Logic
 */

// ============================================================================
// Core Namespace & State
// ============================================================================

var JSZ = {
    data: {
        zettel: {},
        currentKey: "top",
        rightKey: null,
        activePane: "left",
        linksViewPane: "left"
    },
    dataManager: {},
    uiManager: {},
    storageManager: {}
};

if (typeof window !== "undefined") {
    window.JSZ = JSZ;
} else if (typeof globalThis !== "undefined") {
    globalThis.JSZ = JSZ;
}

// Default initial sample dataset
const zstring = JSON.stringify({
    "top": {
        "name": "top",
        "content": "The very top of the Zettelkasten\n\n[[a]]",
        "links": ["a"],
        "fileLinks": [],
        "backlinks": [],
        "creation": "2024-07-30"
    },
    "a": {
        "name": "Test1",
        "content": "This is sample content with an internal link to [[b]].",
        "links": ["b"],
        "fileLinks": [],
        "backlinks": ["top"],
        "creation": "2024-07-30"
    },
    "b": {
        "name": "Test2",
        "content": "Sample note 2 linked from [[a]].",
        "links": [],
        "fileLinks": [],
        "backlinks": ["a"],
        "creation": "2024-07-30"
    },
    "c": {
        "name": "Test3",
        "content": "Standalone sample note.",
        "links": [],
        "fileLinks": [],
        "backlinks": [],
        "creation": "2024-07-30"
    }
});

// ============================================================================
// Data Manager
// ============================================================================

JSZ.dataManager.zettelExists = function(key) {
    return Boolean(key && JSZ.data.zettel[key]);
};

function sortuniq(arr) {
    return Array.from(new Set(arr || [])).sort();
}

function findLinks(text) {
    if (!text) return [];
    const matches = text.match(/\[\[([\s\S]*?)\]\]/g);
    if (!matches) return [];
    return matches
        .map(str => str.slice(2, -2).trim())
        .filter(key => key.length > 0 && key !== "nolinksout");
}

function findFileLinks(text) {
    if (!text) return [];
    const matches = text.match(/<<([\s\S]*?)>>/g);
    if (!matches) return [];
    return matches
        .map(str => str.slice(2, -2).trim())
        .filter(url => url.length > 0 && url !== "nolinksout");
}

function makeEmpty(key) {
    const today = new Date().toISOString().substring(0, 10);
    JSZ.data.zettel[key] = {
        name: key,
        content: `\n\n[[${today}]]`,
        links: [today],
        fileLinks: [],
        backlinks: JSZ.data.currentKey ? [JSZ.data.currentKey] : [],
        creation: today
    };
    return JSZ.data.zettel[key];
}

function cleanBackList() {
    // Clear all backlinks first
    for (const key of Object.keys(JSZ.data.zettel)) {
        if (JSZ.data.zettel[key]) {
            JSZ.data.zettel[key].backlinks = [];
            // Clean up any legacy "nolinksout" tokens
            if (Array.isArray(JSZ.data.zettel[key].links)) {
                JSZ.data.zettel[key].links = JSZ.data.zettel[key].links.filter(l => l !== "nolinksout");
            }
        }
    }
    // Rebuild backlinks from existing outgoing links
    for (const sourceKey of Object.keys(JSZ.data.zettel)) {
        const item = JSZ.data.zettel[sourceKey];
        if (item && Array.isArray(item.links)) {
            for (const targetKey of item.links) {
                if (targetKey === "nolinksout") continue;
                if (JSZ.data.zettel[targetKey]) {
                    if (!JSZ.data.zettel[targetKey].backlinks.includes(sourceKey)) {
                        JSZ.data.zettel[targetKey].backlinks.push(sourceKey);
                    }
                }
            }
        }
    }
}

function parseAllZettels() {
    for (const key of Object.keys(JSZ.data.zettel)) {
        const item = JSZ.data.zettel[key];
        if (item) {
            item.links = findLinks(item.content);
            item.fileLinks = findFileLinks(item.content);
        }
    }
    cleanBackList();
}

function pokeReverseLinks(sourceKey) {
    const src = sourceKey || JSZ.data.currentKey;
    const current = JSZ.data.zettel[src];
    if (!current || !Array.isArray(current.links)) return;

    for (const target of current.links) {
        if (!JSZ.dataManager.zettelExists(target)) {
            makeEmpty(target);
        }
        const targetZettel = JSZ.data.zettel[target];
        if (targetZettel && Array.isArray(targetZettel.backlinks)) {
            if (!targetZettel.backlinks.includes(src)) {
                targetZettel.backlinks.push(src);
            }
        }
    }
}

function deletePaneZettel(pane = "left") {
    const isRight = (pane === "right");
    const keyField = isRight ? document.getElementById("zkey-right") : document.getElementById("zkey");
    const key = keyField ? keyField.value.trim() : (isRight ? JSZ.data.rightKey : JSZ.data.currentKey);

    if (!key || !JSZ.data.zettel[key]) {
        alert("No Zettel selected or Zettel does not exist.");
        return;
    }
    if (key === "top") {
        alert("The 'top' Zettel cannot be deleted.");
        return;
    }

    const noteName = JSZ.data.zettel[key].name || key;
    if (!confirm(`Are you sure you want to delete '${noteName}' (Key: ${key})?\nThis action cannot be undone.`)) {
        return;
    }

    delete JSZ.data.zettel[key];

    // Remove reference from all outgoing links
    for (const k of Object.keys(JSZ.data.zettel)) {
        if (JSZ.data.zettel[k]?.links) {
            JSZ.data.zettel[k].links = JSZ.data.zettel[k].links.filter(l => l !== key);
        }
    }

    cleanBackList();
    populateKeyList();

    if (isRight) {
        if (JSZ.data.rightKey === key) {
            JSZ.data.rightKey = null;
        }
        const remainingKeys = Object.keys(JSZ.data.zettel).filter(k => k !== JSZ.data.currentKey);
        if (remainingKeys.length > 0) {
            showRightObj(remainingKeys[0], false);
        } else {
            closeSplitView();
        }
    } else {
        if (JSZ.data.rightKey === key) {
            JSZ.data.rightKey = null;
            if (JSZ.uiManager.isSplitActive) {
                closeSplitView();
            }
        }
        showObj("top", false);
    }

    updateLinksColumn();
    alert(`Zettel '${key}' deleted.`);
}

function deleteLeftZettel() {
    deletePaneZettel("left");
}

function deleteRightZettel() {
    deletePaneZettel("right");
}

function deleteCurrentZettel() {
    deletePaneZettel(JSZ.data.activePane || "left");
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renameZettel(oldKey, newKey) {
    if (!oldKey || !newKey) {
        alert("Both current and new Zettel keys are required.");
        return false;
    }

    const trimmedOld = oldKey.trim();
    const trimmedNew = newKey.trim();

    if (trimmedOld === trimmedNew) {
        return false;
    }

    if (trimmedOld === "top") {
        alert("The 'top' Zettel cannot be renamed.");
        return false;
    }

    if (!JSZ.dataManager.zettelExists(trimmedOld)) {
        alert(`Zettel '${trimmedOld}' does not exist.`);
        return false;
    }

    if (JSZ.dataManager.zettelExists(trimmedNew)) {
        alert(`A Zettel with key '${trimmedNew}' already exists.`);
        return false;
    }

    // 1. Move note object to new key
    const note = JSZ.data.zettel[trimmedOld];
    delete JSZ.data.zettel[trimmedOld];
    JSZ.data.zettel[trimmedNew] = note;

    // If note name (tags) matched the old key, update it to the new key
    if (note.name === trimmedOld) {
        note.name = trimmedNew;
    }

    // 2. Update content and links across all Zettels
    const linkRegex = new RegExp('\\[\\[\\s*' + escapeRegex(trimmedOld) + '\\s*\\]\\]', 'g');

    for (const key of Object.keys(JSZ.data.zettel)) {
        const item = JSZ.data.zettel[key];
        if (!item) continue;

        // Replace references in content
        if (typeof item.content === "string" && item.content.includes(trimmedOld)) {
            item.content = item.content.replace(linkRegex, `[[${trimmedNew}]]`);
        }

        // Replace references in links array
        if (Array.isArray(item.links)) {
            item.links = sortuniq(item.links.map(k => (k === trimmedOld ? trimmedNew : k)));
        }
    }

    // 3. Rebuild backlinks across all notes
    cleanBackList();

    // 4. Update view
    if (JSZ.data.rightKey === trimmedOld) {
        JSZ.data.rightKey = trimmedNew;
        const rightKeyField = document.getElementById("zkey-right");
        if (rightKeyField) rightKeyField.value = trimmedNew;
    }

    if (JSZ.data.currentKey === trimmedOld) {
        JSZ.data.currentKey = trimmedNew;
        showObj(trimmedNew, false);
    } else {
        JSZ.storageManager.saveToLocalStorage();
        showObj(JSZ.data.currentKey, false);
    }

    if (JSZ.uiManager.isSplitActive && JSZ.data.rightKey) {
        showRightObj(JSZ.data.rightKey, false);
    }

    populateKeyList();
    updateLinksColumn();

    return true;
}

JSZ.dataManager.renameZettel = renameZettel;

function renamePaneZettel(pane = "left") {
    const isRight = (pane === "right");
    if (isRight) {
        saveRightObj();
    } else {
        readObjNoShow();
    }

    const keyField = isRight ? document.getElementById("zkey-right") : document.getElementById("zkey");
    const currentKey = keyField ? keyField.value.trim() : (isRight ? JSZ.data.rightKey : JSZ.data.currentKey);

    if (!currentKey || !JSZ.dataManager.zettelExists(currentKey)) {
        alert("No active Zettel to rename.");
        return;
    }

    if (currentKey === "top") {
        alert("The 'top' Zettel cannot be renamed.");
        return;
    }

    const newKey = prompt(`Enter new key for Zettel '${currentKey}':`, currentKey);
    if (!newKey) return;

    const trimmedNew = newKey.trim();
    if (!trimmedNew || trimmedNew === currentKey) return;

    if (renameZettel(currentKey, trimmedNew)) {
        alert(`Zettel '${currentKey}' successfully renamed to '${trimmedNew}'.`);
    }
}

function renameLeftZettel() {
    renamePaneZettel("left");
}

function renameRightZettel() {
    renamePaneZettel("right");
}

function renameCurrentZettel() {
    renamePaneZettel(JSZ.data.activePane || "left");
}

// ============================================================================
// Storage & Persistence
// ============================================================================

JSZ.storageManager.saveToLocalStorage = function() {
    try {
        localStorage.setItem("snapshot", JSON.stringify(JSZ.data.zettel));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }
};

JSZ.storageManager.loadFromLocalStorage = function() {
    const snapshot = localStorage.getItem("snapshot");
    if (snapshot) {
        try {
            JSZ.data.zettel = JSON.parse(snapshot);
            cleanBackList();
            showObj(JSZ.data.currentKey || "top", false);
        } catch (e) {
            alert("Error parsing stored data: " + e.message);
        }
    } else {
        alert("No data found in browser storage.");
    }
};

function download(text) {
    const payload = typeof text === "string" ? text : JSON.stringify(JSZ.data.zettel, null, 2);
    const date = new Date();
    const defaultFilename = date.toISOString().substring(0, 10) + ".json";
    const userFilename = prompt("Enter filename for download:", defaultFilename);

    if (!userFilename) return;

    const finalName = userFilename.endsWith(".json") ? userFilename : userFilename + ".json";
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function pullfiles() {
    const fileInput = document.getElementById("inputJSON");
    if (!fileInput || !fileInput.files.length) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported || typeof imported !== "object") {
                throw new Error("Invalid Zettelkasten JSON format.");
            }
            JSZ.data.zettel = imported;
            cleanBackList();

            const keys = Object.keys(JSZ.data.zettel);
            const startKey = keys.includes("top") ? "top" : (keys[0] || "top");
            showObj(startKey, false);
            closeSettings();
        } catch (err) {
            alert("Error loading file: " + err.message);
        } finally {
            fileInput.value = "";
        }
    };
    reader.readAsText(file);
}

function resetToZstring() {
    if (!confirm("Are you sure you want to reset all data to the initial sample set? All current changes will be lost.")) {
        return;
    }
    JSZ.data.zettel = JSON.parse(zstring);
    parseAllZettels();
    cleanBackList();
    showObj("top", false);
    alert("Zettelkasten has been reset to default sample data.");
}

// ============================================================================
// UI & Display Management
// ============================================================================

JSZ.uiManager.currentBaseFontSizePt = 12;
JSZ.uiManager.isPreviewMode = false;

JSZ.uiManager.updatePageFontSize = function(sizeInPt) {
    document.body.style.fontSize = sizeInPt + "pt";
};

JSZ.uiManager.increaseFontSize = function() {
    this.currentBaseFontSizePt += 1;
    this.updatePageFontSize(this.currentBaseFontSizePt);
};

JSZ.uiManager.decreaseFontSize = function() {
    if (this.currentBaseFontSizePt > 6) {
        this.currentBaseFontSizePt -= 1;
        this.updatePageFontSize(this.currentBaseFontSizePt);
    }
};

JSZ.uiManager.setSolarizedTheme = function() {
    document.getElementById("theme-stylesheet").href = "JSZ4_solarized_v2.css";
};

JSZ.uiManager.setGrayTheme = function() {
    document.getElementById("theme-stylesheet").href = "JSZ4_gray_v2.css";
};

function setSolarizedTheme() {
    JSZ.uiManager.setSolarizedTheme();
    closeSettings();
}

function setGrayTheme() {
    JSZ.uiManager.setGrayTheme();
    closeSettings();
}

function openSettings() {
    document.getElementById("settings-modal").style.display = "block";
}

function closeSettings() {
    document.getElementById("settings-modal").style.display = "none";
}

function openSearchSidebar() {
    document.getElementById("search-sidebar").classList.add("open");
    document.body.classList.add("search-open");
}

function closeSearchSidebar() {
    document.getElementById("search-sidebar").classList.remove("open");
    document.body.classList.remove("search-open");
}

// Tooltip helper
function getZettelTooltip(key) {
    const hint = JSZ.uiManager.isSplitActive ? "\n(Click: Left | Alt+Click: Right)" : "";
    if (!JSZ.dataManager.zettelExists(key)) {
        return `Zettel Key: ${key} (Click to create)${hint}`;
    }
    const target = JSZ.data.zettel[key];
    const content = target?.content?.trim();
    if (content) return content + hint;
    const tags = target?.name?.trim();
    if (tags) return `Tags: ${tags} (Content is empty)${hint}`;
    return `Zettel Key: ${key} (Content and Tags are empty)${hint}`;
}

function makeJumpButton(str, tofield, targetPane = null) {
    if (!JSZ.dataManager.zettelExists(str)) {
        makeEmpty(str);
    }
    const container = document.getElementById(tofield);
    if (!container) return;

    const btn = document.createElement("button");
    btn.textContent = str;
    btn.dataset.tooltip = getZettelTooltip(str);
    btn.onmousemove = function(e) { showTooltip(e, this.dataset.tooltip); };
    btn.onmouseout = hideTooltip;
    btn.onclick = function(e) {
        hideTooltip();
        const effectiveTarget = targetPane || JSZ.data.activePane || 'left';
        if (e && (e.altKey || (JSZ.uiManager.isSplitActive && e.shiftKey))) {
            // Open across in the other pane
            if (effectiveTarget === 'right') {
                showObj(str);
            } else {
                showRightObj(str);
            }
        } else {
            // Open in effectiveTarget pane
            if (effectiveTarget === 'right' && JSZ.uiManager.isSplitActive) {
                showRightObj(str);
            } else {
                showObj(str);
            }
        }
    };
    container.appendChild(btn);

    const target = JSZ.data.zettel[str];
    if (target && target.name) {
        const span = document.createElement("span");
        span.textContent = " " + target.name;
        container.appendChild(span);
    }
    container.appendChild(document.createElement("br"));
}

function makeExternalLinkButton(url, tofield) {
    const container = document.getElementById(tofield);
    if (!container) return;

    const link = document.createElement("a");
    let href = url;
    if (!url.match(/^([a-zA-Z]+:)/)) {
        if (url.startsWith("www.") || (url.includes(".") && !url.includes(" ") && !url.startsWith("/"))) {
            href = "//" + url;
        }
    }
    link.href = href;
    link.textContent = url;
    link.title = "Open: " + url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "block";
    link.style.color = "#2AA198";
    container.appendChild(link);
}

// ============================================================================
// Markdown Preview & Rendering
// ============================================================================

function togglePreviewMode() {
    toggleLeftPreviewMode();
}

function toggleLeftPreviewMode() {
    const previewBtn = document.getElementById("preview-toggle-btn");
    const editor = document.getElementById("zcontent");
    const preview = document.getElementById("zcontent-preview");
    if (!editor || !preview) return;

    JSZ.uiManager.isPreviewMode = !JSZ.uiManager.isPreviewMode;

    if (JSZ.uiManager.isPreviewMode) {
        if (previewBtn) previewBtn.innerText = "Edit";
        editor.style.display = "none";
        preview.style.display = "block";
        preview.innerHTML = renderMarkdown(editor.value, "left");
    } else {
        if (previewBtn) previewBtn.innerText = "Preview";
        preview.style.display = "none";
        editor.style.display = "block";
    }
}

function toggleRightPreviewMode() {
    const previewBtn = document.getElementById("preview-toggle-btn-right");
    const editor = document.getElementById("zcontent-right");
    const preview = document.getElementById("zcontent-preview-right");
    if (!editor || !preview) return;

    JSZ.uiManager.isRightPreviewMode = !JSZ.uiManager.isRightPreviewMode;

    if (JSZ.uiManager.isRightPreviewMode) {
        if (previewBtn) previewBtn.innerText = "Edit";
        editor.style.display = "none";
        preview.style.display = "block";
        preview.innerHTML = renderMarkdown(editor.value, "right");
    } else {
        if (previewBtn) previewBtn.innerText = "Preview";
        preview.style.display = "none";
        editor.style.display = "block";
    }
}

function renderMarkdown(text, sourcePane = "left") {
    if (!text) return "";

    // 1. Escape HTML
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 2. Headers (# heading)
    html = html.replace(/^(#{1,6})\s+(.*)$/gm, function(_, hashes, content) {
        const level = hashes.length;
        return `<h${level}>${content}</h${level}>`;
    });

    // 3. Internal Links [[note_key]]
    html = html.replace(/\[\[([\s\S]*?)\]\]/g, function(_, rawKey) {
        const key = rawKey.trim();
        if (!key) return "";
        const safeTooltip = getZettelTooltip(key).replace(/"/g, "&quot;");
        if (sourcePane === "right") {
            return `<a href="javascript:void(0)" data-tooltip="${safeTooltip}" onmousemove="showTooltip(event, this.dataset.tooltip)" onmouseout="hideTooltip()" onclick="if (event && (event.altKey || (JSZ.uiManager.isSplitActive && event.shiftKey))) { if (!JSZ.dataManager.zettelExists('${key}')) { makeEmpty('${key}'); } hideTooltip(); showObj('${key}'); } else { if (!JSZ.dataManager.zettelExists('${key}')) { makeEmpty('${key}'); } hideTooltip(); showRightObj('${key}'); }" style="font-weight: bold; text-decoration: underline; cursor: pointer;">[[ ${key} ]]</a>`;
        } else {
            return `<a href="javascript:void(0)" data-tooltip="${safeTooltip}" onmousemove="showTooltip(event, this.dataset.tooltip)" onmouseout="hideTooltip()" onclick="if (event && (event.altKey || (JSZ.uiManager.isSplitActive && event.shiftKey))) { if (!JSZ.dataManager.zettelExists('${key}')) { makeEmpty('${key}'); } hideTooltip(); showRightObj('${key}'); } else { if (!JSZ.dataManager.zettelExists('${key}')) { makeEmpty('${key}'); } hideTooltip(); showObj('${key}'); }" style="font-weight: bold; text-decoration: underline; cursor: pointer;">[[ ${key} ]]</a>`;
        }
    });

    // 4. External Links <<url>>
    html = html.replace(/&lt;&lt;([\s\S]*?)&gt;&gt;/g, function(_, url) {
        const cleanUrl = url.trim();
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; cursor: pointer; font-style: italic;">${cleanUrl}</a>`;
    });

    // 5. Paragraphs & Line Breaks
    const blocks = html.split(/\n\s*\n/);
    return blocks.map(function(block) {
        block = block.trim();
        if (!block) return "";
        if (/^<h[1-6]>.*<\/h[1-6]>$/.test(block)) return block;
        return "<p>" + block.replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
}

// ============================================================================
// Dual-Pane & Split View Management
// ============================================================================

JSZ.uiManager.isSplitActive = false;
JSZ.uiManager.isPreviewMode = false;
JSZ.uiManager.isRightPreviewMode = false;

function populateKeyList() {
    const datalist = document.getElementById("zettel-keys-list");
    if (!datalist) return;
    datalist.innerHTML = "";
    const allKeys = Object.keys(JSZ.data.zettel).sort();
    for (const k of allKeys) {
        const option = document.createElement("option");
        option.value = k;
        const note = JSZ.data.zettel[k];
        if (note && note.name) {
            option.label = note.name;
        }
        datalist.appendChild(option);
    }
}

function setActivePane(pane) {
    if (pane !== "left" && pane !== "right") return;
    JSZ.data.activePane = pane;

    const colLeft = document.getElementById("col2");
    const colRight = document.getElementById("col-right");
    const statusText = document.getElementById("active-pane-status");

    if (pane === "left") {
        if (colLeft) colLeft.classList.add("active-pane");
        if (colRight) colRight.classList.remove("active-pane");
        if (statusText) statusText.textContent = "Active Pane: Left";
    } else {
        if (colRight) colRight.classList.add("active-pane");
        if (colLeft) colLeft.classList.remove("active-pane");
        if (statusText) statusText.textContent = "Active Pane: Right";
    }

    if (JSZ.uiManager.isSplitActive) {
        switchLinksTab(pane);
    }
}

function switchLinksTab(pane) {
    if (pane !== "left" && pane !== "right") return;
    JSZ.data.linksViewPane = pane;

    const tabLeft = document.getElementById("tab-links-left");
    const tabRight = document.getElementById("tab-links-right");
    if (tabLeft && tabRight) {
        if (pane === "left") {
            tabLeft.classList.add("active");
            tabRight.classList.remove("active");
        } else {
            tabRight.classList.add("active");
            tabLeft.classList.remove("active");
        }
    }
    updateLinksColumn();
}

function updateLinksColumn() {
    const pane = (JSZ.uiManager.isSplitActive && JSZ.data.linksViewPane === "right") ? "right" : "left";
    const key = (pane === "right") ? JSZ.data.rightKey : JSZ.data.currentKey;

    const currentKeySpan = document.getElementById("links-current-key");
    if (currentKeySpan) currentKeySpan.textContent = key || "none";

    const tabBar = document.getElementById("links-tab-bar");
    if (tabBar) {
        if (JSZ.uiManager.isSplitActive) {
            tabBar.style.display = "flex";
            const tabLeft = document.getElementById("tab-links-left");
            const tabRight = document.getElementById("tab-links-right");
            if (tabLeft) tabLeft.textContent = `Left: ${JSZ.data.currentKey || "none"}`;
            if (tabRight) tabRight.textContent = `Right: ${JSZ.data.rightKey || "none"}`;
            if (JSZ.data.linksViewPane === "right") {
                if (tabRight) tabRight.classList.add("active");
                if (tabLeft) tabLeft.classList.remove("active");
            } else {
                if (tabLeft) tabLeft.classList.add("active");
                if (tabRight) tabRight.classList.remove("active");
            }
        } else {
            tabBar.style.display = "none";
        }
    }

    const forwardDiv = document.getElementById("forwardbuttons");
    const reverseDiv = document.getElementById("reversebuttons");
    if (!forwardDiv || !reverseDiv) return;

    forwardDiv.innerHTML = "";
    reverseDiv.innerHTML = "";

    if (!key || !JSZ.data.zettel[key]) return;
    const note = JSZ.data.zettel[key];

    // Outgoing links
    if (note.links && note.links.length > 0) {
        for (const linkKey of note.links) {
            makeJumpButton(linkKey, "forwardbuttons", pane);
        }
    }

    // Outgoing file / URL links
    if (note.fileLinks && note.fileLinks.length > 0) {
        if (note.links && note.links.length > 0) {
            const hr = document.createElement("hr");
            hr.className = "link-divider";
            forwardDiv.appendChild(hr);
        }
        for (const url of note.fileLinks) {
            makeExternalLinkButton(url, "forwardbuttons");
        }
    }

    // Incoming links (backlinks)
    if (note.backlinks && note.backlinks.length > 0) {
        for (const backlinkKey of note.backlinks) {
            makeJumpButton(backlinkKey, "reversebuttons", pane);
        }
    }
}

function openSplitView(initialKey) {
    JSZ.uiManager.isSplitActive = true;
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) wrapper.classList.add("split-active");

    const colLeft = document.getElementById("col2");
    const colRight = document.getElementById("col-right");
    const resizerSplit = document.getElementById("resizer-split");

    if (resizerSplit) resizerSplit.style.display = "flex";
    if (colRight) colRight.style.display = "flex";

    if (colLeft && colRight) {
        colLeft.style.flex = "1 1 0";
        colRight.style.flex = "1 1 0";
    }

    const splitBtn = document.getElementById("split-view-btn");
    if (splitBtn) splitBtn.innerText = "Close Split";

    const leftLabel = document.getElementById("pane-label-left");
    if (leftLabel) leftLabel.innerText = "Left:";

    populateKeyList();

    // Determine starting key for right pane
    let chosenKey = initialKey;
    if (!chosenKey || !JSZ.dataManager.zettelExists(chosenKey)) {
        if (JSZ.data.rightKey && JSZ.dataManager.zettelExists(JSZ.data.rightKey) && JSZ.data.rightKey !== JSZ.data.currentKey) {
            chosenKey = JSZ.data.rightKey;
        } else {
            const curr = JSZ.data.zettel[JSZ.data.currentKey];
            if (curr && Array.isArray(curr.links) && curr.links.length > 0 && JSZ.dataManager.zettelExists(curr.links[0])) {
                chosenKey = curr.links[0];
            } else {
                const keys = Object.keys(JSZ.data.zettel);
                chosenKey = keys.find(k => k !== JSZ.data.currentKey) || "top";
            }
        }
    }

    showRightObj(chosenKey, false);
    updateLinksColumn();
}

function closeSplitView() {
    saveRightObj();
    JSZ.uiManager.isSplitActive = false;

    const wrapper = document.querySelector(".wrapper");
    if (wrapper) wrapper.classList.remove("split-active");

    const colLeft = document.getElementById("col2");
    const colRight = document.getElementById("col-right");
    const resizerSplit = document.getElementById("resizer-split");

    if (resizerSplit) resizerSplit.style.display = "none";
    if (colRight) colRight.style.display = "none";
    if (colLeft) {
        colLeft.style.flex = "1 1 0";
    }

    const splitBtn = document.getElementById("split-view-btn");
    if (splitBtn) splitBtn.innerText = "Split View";

    const leftLabel = document.getElementById("pane-label-left");
    if (leftLabel) leftLabel.innerText = "Note:";

    setActivePane("left");
    updateLinksColumn();
}

function toggleSplitView() {
    if (JSZ.uiManager.isSplitActive) {
        closeSplitView();
    } else {
        openSplitView();
    }
}

function showLeftObj(key, saveCurrent = true) {
    showObj(key, saveCurrent);
}

function showLeftObjFromInput() {
    const keyField = document.getElementById("zkey");
    if (!keyField) return;
    const key = keyField.value.trim();
    if (key) {
        showObj(key);
    }
}

function showRightObj(key, saveCurrent = true) {
    if (!key) return;

    if (saveCurrent && JSZ.data.rightKey && JSZ.data.rightKey !== key) {
        saveRightObj();
    }

    if (!JSZ.dataManager.zettelExists(key)) {
        makeEmpty(key);
    }

    const note = JSZ.data.zettel[key];
    note.backlinks = sortuniq(note.backlinks);
    note.links = (note.links || []).filter(l => l !== "nolinksout");

    JSZ.data.rightKey = key;

    if (!JSZ.uiManager.isSplitActive) {
        openSplitView(key);
        return;
    }

    const keyField = document.getElementById("zkey-right");
    if (keyField) keyField.value = key;

    const nameField = document.getElementById("zname-right");
    if (nameField) nameField.value = note?.name || "";

    const dateField = document.getElementById("zdate-right");
    if (dateField) dateField.value = note?.creation || "";

    const editor = document.getElementById("zcontent-right");
    if (editor) editor.value = note?.content || "";

    const preview = document.getElementById("zcontent-preview-right");
    if (preview && JSZ.uiManager.isRightPreviewMode) {
        preview.innerHTML = renderMarkdown(note?.content || "", "right");
    }

    populateKeyList();
    updateLinksColumn();
}

function showRightObjFromInput() {
    const keyField = document.getElementById("zkey-right");
    if (!keyField) return;
    const key = keyField.value.trim();
    if (key) {
        showRightObj(key);
    }
}

function saveLeftObj() {
    readObj();
}

function saveRightObj() {
    if (!JSZ.uiManager.isSplitActive || !JSZ.data.rightKey) return;
    const key = JSZ.data.rightKey;
    const editor = document.getElementById("zcontent-right");
    if (!editor || !JSZ.data.zettel[key]) return;

    const newContent = editor.value;
    JSZ.data.zettel[key].content = newContent;
    JSZ.data.zettel[key].links = findLinks(newContent);
    JSZ.data.zettel[key].fileLinks = findFileLinks(newContent);

    const nameField = document.getElementById("zname-right");
    if (nameField) {
        JSZ.data.zettel[key].name = nameField.value;
    }

    cleanBackList();
    JSZ.storageManager.saveToLocalStorage();
    populateKeyList();
    updateLinksColumn();
}

function saveActiveObj() {
    if (JSZ.uiManager.isSplitActive && JSZ.data.activePane === "right") {
        saveRightObj();
    } else {
        saveLeftObj();
    }
}

JSZ.uiManager.openSplitView = openSplitView;
JSZ.uiManager.closeSplitView = closeSplitView;
JSZ.uiManager.toggleSplitView = toggleSplitView;
JSZ.uiManager.showRightObj = showRightObj;
JSZ.uiManager.saveRightObj = saveRightObj;
JSZ.uiManager.toggleRightPreviewMode = toggleRightPreviewMode;

// ============================================================================
// Core Note Editor Operations
// ============================================================================

function readObjNoShow() {
    const keyField = document.getElementById("zkey");
    if (!keyField) return;
    const key = keyField.value.trim();
    if (!key) return;

    const nameField = document.getElementById("zname");
    const name = nameField ? nameField.value : "";
    const contentField = document.getElementById("zcontent");
    const content = contentField ? contentField.value : "";
    const dateField = document.getElementById("zdate");
    const creation = (dateField && dateField.value) ? dateField.value : new Date().toISOString().substring(0, 10);
    const existing = JSZ.data.zettel[key];
    const backlinks = existing ? (existing.backlinks || []) : [];

    const links = findLinks(content);
    const fileLinks = findFileLinks(content);

    JSZ.data.zettel[key] = {
        name: name,
        content: content,
        links: links,
        fileLinks: fileLinks,
        backlinks: backlinks,
        creation: creation
    };

    pokeReverseLinks(key);
}

function readObj() {
    const keyField = document.getElementById("zkey");
    const key = keyField ? keyField.value.trim() : "";
    readObjNoShow();
    if (key) showObj(key, false);
}

function showObj(key, saveCurrent = true) {
    if (saveCurrent) {
        readObjNoShow();
    }

    if (!JSZ.dataManager.zettelExists(key)) {
        makeEmpty(key);
    }

    const note = JSZ.data.zettel[key];
    note.backlinks = sortuniq(note.backlinks);
    note.links = (note.links || []).filter(l => l !== "nolinksout");

    // Populate UI fields
    const keyField = document.getElementById("zkey");
    if (keyField) keyField.value = key;
    const nameField = document.getElementById("zname");
    if (nameField) nameField.value = note.name || "";
    const contentField = document.getElementById("zcontent");
    if (contentField) contentField.value = note.content || "";
    const nextField = document.getElementById("nextz");
    if (nextField) nextField.value = JSZ.data.currentKey || "top";
    const dateField = document.getElementById("zdate");
    if (dateField) dateField.value = note.creation || "";
    const countField = document.getElementById("zcount");
    if (countField) countField.value = Object.keys(JSZ.data.zettel).length;

    if (JSZ.uiManager.isPreviewMode) {
        const preview = document.getElementById("zcontent-preview");
        if (preview) preview.innerHTML = renderMarkdown(note.content || "", "left");
    }

    JSZ.data.currentKey = key;

    populateKeyList();
    updateLinksColumn();
    JSZ.storageManager.saveToLocalStorage();
}

function showNextObj() {
    const nextInput = document.getElementById("nextz");
    if (!nextInput) return;
    const next = nextInput.value.trim();
    if (!next) return;

    if (JSZ.uiManager.isSplitActive && JSZ.data.activePane === "right") {
        showRightObj(next);
    } else {
        showObj(next);
    }
}

function jumpTop() {
    if (JSZ.uiManager.isSplitActive && JSZ.data.activePane === "right") {
        showRightObj("top");
    } else {
        showObj("top");
    }
}

// ============================================================================
// Search Tools
// ============================================================================

function searchZettelForRegex() {
    const term = document.getElementById("searchRegEx").value.trim();
    const resultsDiv = document.getElementById("searchresults");
    resultsDiv.innerHTML = "";

    if (!term) {
        resultsDiv.textContent = "Search Results";
        return;
    }

    try {
        const re = new RegExp(term, "i");
        let matches = 0;
        for (const key of Object.keys(JSZ.data.zettel)) {
            const note = JSZ.data.zettel[key];
            if (re.test(key) || (note.name && re.test(note.name))) {
                makeJumpButton(key, "searchresults", JSZ.data.activePane || "left");
                matches++;
            }
        }
        if (matches === 0) resultsDiv.textContent = "No tag/key matches found.";
    } catch (e) {
        resultsDiv.textContent = "Invalid regular expression.";
    }
}

function searchZettelContent() {
    const term = document.getElementById("searchFullText").value.trim();
    const resultsDiv = document.getElementById("searchresults");
    resultsDiv.innerHTML = "";

    if (!term) {
        resultsDiv.textContent = "Search Results";
        return;
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    let matches = 0;

    for (const key of Object.keys(JSZ.data.zettel)) {
        const note = JSZ.data.zettel[key];
        if (note.content && re.test(note.content)) {
            makeJumpButton(key, "searchresults", JSZ.data.activePane || "left");
            matches++;
        }
    }
    if (matches === 0) resultsDiv.textContent = "No content matches found.";
}

// ============================================================================
// Custom Global Tooltip
// ============================================================================

const globalTooltip = document.createElement("div");
globalTooltip.id = "global-tooltip";

function showTooltip(e, text) {
    if (!text) return;
    globalTooltip.textContent = text;
    globalTooltip.style.display = "block";

    let x = e.pageX + 15;
    let y = e.pageY + 15;

    if (x + globalTooltip.offsetWidth > window.innerWidth) {
        x = window.innerWidth - globalTooltip.offsetWidth - 10;
    }
    if (y + globalTooltip.offsetHeight > window.innerHeight) {
        y = e.pageY - globalTooltip.offsetHeight - 15;
    }

    globalTooltip.style.left = x + "px";
    globalTooltip.style.top = y + "px";
}

function hideTooltip() {
    globalTooltip.style.display = "none";
}

// ============================================================================
// Initialization & Global Event Listeners
// ============================================================================

document.addEventListener("keydown", function(e) {
    // Ctrl+P / Cmd+P -> Save active pane
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        saveActiveObj();
    }
    // Ctrl+S / Cmd+S -> Download JSON
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        download();
    }
    // Ctrl+T / Cmd+T -> Jump to Top
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        jumpTop();
    }
    // Escape -> Close modals / sidebars
    if (e.key === "Escape") {
        closeSettings();
        closeSearchSidebar();
    }
});

window.addEventListener("click", function(event) {
    const modal = document.getElementById("settings-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// ============================================================================
// Draggable Pane Resizing (Boundary & Overlap Protection)
// ============================================================================

function initResizeHandlers() {
    const resizerSplit = document.getElementById("resizer-split");
    const resizerLinks = document.getElementById("resizer-links");
    const resizerBottom = document.getElementById("resizer-bottom");
    const colLeft = document.getElementById("col2");
    const colRight = document.getElementById("col-right");
    const colLinks = document.getElementById("col-links");
    const wrapper = document.getElementById("main-wrapper") || document.querySelector(".wrapper");

    const MIN_PANE_WIDTH = 180;
    const MIN_LINKS_WIDTH = 150;
    const MIN_HEIGHT = 180;

    function attachDrag(resizer, onMove, onEnd) {
        if (!resizer) return;
        resizer.addEventListener("mousedown", function(e) {
            e.preventDefault();
            resizer.classList.add("resizing");
            document.body.classList.add("is-resizing");

            function moveHandler(moveEvent) {
                onMove(moveEvent);
            }
            function upHandler() {
                resizer.classList.remove("resizing");
                document.body.classList.remove("is-resizing");
                window.removeEventListener("mousemove", moveHandler);
                window.removeEventListener("mouseup", upHandler);
                if (onEnd) onEnd();
            }
            window.addEventListener("mousemove", moveHandler);
            window.addEventListener("mouseup", upHandler);
        });
    }

    // 1. Resizer Split: Adjusts boundary between Left and Right Panes
    let splitStartX, splitLeftStartW, splitRightStartW;
    if (resizerSplit) {
        resizerSplit.addEventListener("mousedown", function(e) {
            splitStartX = e.clientX;
            splitLeftStartW = colLeft ? colLeft.getBoundingClientRect().width : 0;
            splitRightStartW = colRight ? colRight.getBoundingClientRect().width : 0;
        });
        attachDrag(
            resizerSplit,
            function(e) {
                if (!colLeft || !colRight) return;
                const delta = e.clientX - splitStartX;
                const totalWidth = splitLeftStartW + splitRightStartW;

                let newLeft = Math.max(MIN_PANE_WIDTH, Math.min(totalWidth - MIN_PANE_WIDTH, splitLeftStartW + delta));
                let newRight = totalWidth - newLeft;

                colLeft.style.flex = `0 0 ${newLeft}px`;
                colRight.style.flex = `0 0 ${newRight}px`;
            },
            function() {
                if (colLeft && colRight) {
                    localStorage.setItem("split_left_width", colLeft.offsetWidth);
                    localStorage.setItem("split_right_width", colRight.offsetWidth);
                }
            }
        );
    }

    // 2. Resizer Links: Adjusts boundary between active editor and Links column
    let linksStartX, editorAdjacentStartW, linksStartW;
    if (resizerLinks) {
        resizerLinks.addEventListener("mousedown", function(e) {
            linksStartX = e.clientX;
            const adjacentPane = (JSZ.uiManager.isSplitActive && colRight) ? colRight : colLeft;
            editorAdjacentStartW = adjacentPane ? adjacentPane.getBoundingClientRect().width : 0;
            linksStartW = colLinks ? colLinks.getBoundingClientRect().width : 0;
        });
        attachDrag(
            resizerLinks,
            function(e) {
                if (!colLinks) return;
                const adjacentPane = (JSZ.uiManager.isSplitActive && colRight) ? colRight : colLeft;
                if (!adjacentPane) return;

                const delta = e.clientX - linksStartX;
                const totalWidth = editorAdjacentStartW + linksStartW;

                let newAdj = Math.max(MIN_PANE_WIDTH, Math.min(totalWidth - MIN_LINKS_WIDTH, editorAdjacentStartW + delta));
                let newLinks = totalWidth - newAdj;

                adjacentPane.style.flex = `0 0 ${newAdj}px`;
                colLinks.style.flex = `0 0 ${newLinks}px`;
            },
            function() {
                if (colLinks) {
                    localStorage.setItem("links_width", colLinks.offsetWidth);
                }
            }
        );
    }

    // 3. Resizer Bottom: Adjusts vertical height of the work area
    let bottomStartY, wrapperStartH;
    if (resizerBottom) {
        resizerBottom.addEventListener("mousedown", function(e) {
            bottomStartY = e.clientY;
            wrapperStartH = wrapper ? wrapper.getBoundingClientRect().height : 0;
        });
        attachDrag(
            resizerBottom,
            function(e) {
                if (!wrapper) return;
                const delta = e.clientY - bottomStartY;
                const maxH = window.innerHeight - 180;
                let newH = Math.max(MIN_HEIGHT, Math.min(maxH, wrapperStartH + delta));
                wrapper.style.height = `${newH}px`;
            },
            function() {
                if (wrapper) {
                    localStorage.setItem("panes_height", wrapper.offsetHeight);
                }
            }
        );
    }

    // Restore saved height if available
    const savedH = localStorage.getItem("panes_height");
    if (savedH && wrapper) {
        const parsedH = parseInt(savedH, 10);
        if (parsedH >= MIN_HEIGHT && parsedH <= window.innerHeight - 150) {
            wrapper.style.height = `${parsedH}px`;
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    document.body.appendChild(globalTooltip);

    // Initialize draggable split and height resizers
    initResizeHandlers();

    // Attach active-pane tracking to pane columns
    const colLeft = document.getElementById("col2");
    if (colLeft) {
        colLeft.addEventListener("focusin", function() { setActivePane("left"); });
        colLeft.addEventListener("click", function() { setActivePane("left"); });
    }
    const colRight = document.getElementById("col-right");
    if (colRight) {
        colRight.addEventListener("focusin", function() { setActivePane("right"); });
        colRight.addEventListener("click", function() { setActivePane("right"); });
    }

    // Load from localStorage if present, otherwise default sample data
    const stored = localStorage.getItem("snapshot");
    if (stored) {
        try {
            JSZ.data.zettel = JSON.parse(stored);
        } catch (e) {
            console.warn("Could not parse localStorage snapshot:", e);
            JSZ.data.zettel = JSON.parse(zstring);
        }
    } else {
        JSZ.data.zettel = JSON.parse(zstring);
    }

    cleanBackList();
    showObj("top", false);
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        JSZ,
        findLinks,
        findFileLinks,
        cleanBackList,
        parseAllZettels,
        renderMarkdown,
        getZettelTooltip,
        renameZettel,
        renamePaneZettel,
        renameLeftZettel,
        renameRightZettel,
        deletePaneZettel,
        deleteLeftZettel,
        deleteRightZettel,
        openSplitView,
        closeSplitView,
        toggleSplitView,
        showLeftObj,
        showLeftObjFromInput,
        showRightObj,
        showRightObjFromInput,
        saveLeftObj,
        saveRightObj,
        saveActiveObj,
        setActivePane,
        switchLinksTab,
        updateLinksColumn
    };
}
