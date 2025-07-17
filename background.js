console.log("Running background.js");

var gotaTabs = [];     // array of tab ids with url gota.io
var gotaWindows = [];  // array of window ids url gota.io
var index = null;       // index may be 0 or 1

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "switchTabs") {
        updateTabs().then(() => {
            console.log("Switching tabs!");
            switch (gotaTabs.length) {
                case 2: // switch tabs
                    console.log(`Switching to index ${index}`);
                    browser.tabs.update(gotaTabs[index ? 0 : 1], { active: true });
                    break;
                case 1: // make a new tab
                    browser.tabs.get(gotaTabs[0], function(tab) {
                        browser.tabs.create({ url: tab.url });
                    });
                    break;
                case 0:
                    console.warn("Warning: No active gota tab found.");
                    break;
                default:
                    console.warn("Warning: 3+ tabs are not supported.");
            }
        });
    } else if (request.action === "switchWindows") {
        updateWindows().then(() => {
            console.log("Switching windows!");
            switch (gotaWindows.length) {
                case 2: // switch windows
                    browser.windows.update(gotaWindows[index ? 0 : 1], {focused: true });
                    break;
                case 1: // open a new window
                    browser.windows.get(gotaWindows[0], { populate: true }, (window) => openWindow(window));
                    break;
                case 0:
                    console.warn("Warning: No active gota window found.")
                    break;
                default:
                    console.warn("Warning: 3+ windows are not supported.");
                    break;
            }
        });
    } else if (request.action === "updateTabs") {
        updateTabs();
    }
});

// this is weird, but you pass a window and this function opens a new window with the same url
function openWindow(window) {
    const gotaTab = window.tabs.find(tab => tab.url.includes('gota.io'));
    if (gotaTab) {
        // Create a new window with the gota.io tab URL
        browser.windows.create({ url: gotaTab.url });
    } else {
        console.warn("Warning: No gota.io tab found in the existing window.");
    }
}

// update global variables index and window[]
function updateWindows() {
    return browser.windows.getAll({ populate: true })
    .then((windows) => {
        // Filter for windows that have a gota.io tab and store their IDs
        gotaWindows = windows.filter(win => 
            win.tabs.some(tab => tab.url && tab.url.includes('https://gota.io')))
            .map(win => win.id); // Store only the window IDs

        console.log(`Germs.io windows found: ${gotaWindows.length}`);

        const activeWindow = windows.find(win => 
            win.focused && win.tabs.some(tab => tab.active && tab.url.includes('https://gota.io')));

        if (activeWindow) {
            console.log("Active gota.io window found");
            index = gotaWindows.indexOf(activeWindow.id);
        } else {
            console.log('Found no active gota window.');
        }
    })
    .catch((error) => {
        console.error('Error: ', error);
    });
}

// update global variables gotaTabs[] and index
function updateTabs() {
    return browser.tabs.query({ currentWindow: true, url: "https://gota.io/*" })
    .then((tabs) => {
        gotaTabs = tabs.map(tab => tab.id);
        console.log(`Germs.io tabs found: ${gotaTabs.length}`);
        const activeTab = tabs.find(tab => tab.active);
        //console.log(activeTab);
        if (activeTab) {
            // If an active tab is found, update switcherTabIndex
            index = gotaTabs.indexOf(activeTab.id);
        } else {
            console.log('Found no active gota tab.');
        }
    })
    .catch((error) => {
        console.error('Error: ', error);
        throw error;
    });
}

