console.log("Running content.js");
console.log("Icon path:", chrome.runtime.getURL("images/gsDuhFox-19.png"));

updateAllSettings();

var testerWaiting; // is the tester waiting for the user to input
var switcherKey; // array of [keyCode, key]
var switcherWindowed; // boolean which defines whether the switcher is tabbed or windowed
var switcherEnabled; // boolean which defines whether the switcher is turned on

var usingTextBox = false; // :chatting:

var chatInput = document.getElementById("chat-input");
var chatBox = document.getElementById("chat-body-0"); // Global chat
var nickInput = document.getElementById("name-box");
var bottomRight = document.getElementsByClassName("main-bottom-right")[0];
var mainRight = document.getElementById("main-right");
var bottomRightStats = document.getElementsByClassName("main-bottom-stats")[0];
bottomRightStats.style.height = "76%";


const settingsButtonHTML = `
<button id="gotafoxButton" class="bottom-btn gotafox-btn">
    <b>Gotafox</b>
</button>`;

const settingsPanelHTML = `
<div id="gotafoxSettingsPanel" class="main-right-panel gotafox-panel">
    <div class="gotafox-panel-content">
        <div class="title-text menu-title">
	    <b>Gotafox</b>
	</div>
	    <div class="options-container gotafox-options-container">
	        <table class="options-table">
		    <thead>
			<tr>
			    <th colspan="4">Multibox</th>
			</tr>
		    </thead>
		    <tbody>
		    	<tr>
			    <td colspan="3">Enable multiboxing</td>
			    <td>
		                <input type="checkbox" id="enabledCheckbox">
			    </td>
			</tr>
			<tr>
			    <td colspan="3">Windowed mode</td>
			    <td>
			        <input type="checkbox" id="windowedCheckbox">
			    </td>
			</tr>
		    </tbody>
		    <thead>
			<tr>
			    <th colspan="4">Keybinds</th>
			</tr>
		    </thead
		    <tbody>
			<tr>
			    <td colspan="3">Switch tabs</td>
			    <td>
				<div id="keyTester" class="key-tester"></div>
			    </td>
			</tr>
		    </tbody>
		</div>
	    </div>
	</div>
    </div>
</div>`;

bottomRight.insertAdjacentHTML("afterbegin", settingsButtonHTML);
mainRight.insertAdjacentHTML("afterBegin", settingsPanelHTML);

var gotafoxButton = document.getElementById("gotafoxButton");
var settingsPanel = document.getElementById("gotafoxSettingsPanel");
var keyTester = document.getElementById("keyTester");
var enabledCheckbox = document.getElementById("enabledCheckbox");
var windowedCheckbox = document.getElementById("windowedCheckbox");

var chatObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "childList") {
      const lastMessage = chatBox.lastElementChild;
      if (lastMessage) {
	// might be useful later
      }
    }
  });
});

chatObserver.observe(chatBox, { childList: true });

document.addEventListener("keydown", keydown);
chatInput.addEventListener("focus", startedUsingTextBox);
chatInput.addEventListener("blur", stoppedUsingTextBox);
nickInput.addEventListener("focus", startedUsingTextBox);
nickInput.addEventListener("blur", stoppedUsingTextBox);
enabledCheckbox.addEventListener("change", checkboxChanged);
windowedCheckbox.addEventListener("change", checkboxChanged);
gotafoxButton.addEventListener("click", openSettingsMenu);

function openSettingsMenu() {
  if (settingsPanel.style.display == "block") {
    return;
  }
  stopWaiting(); // just to update the style
  chrome.storage.local.get(
    ["switcherEnabled", "switcherWindowed", "ignoreInvites"],
    function (items) {
      enabledCheckbox.checked = items.switcherEnabled;
      windowedCheckbox.checked = items.switcherWindowed;
    }
  );
  settingsPanel.classList.add('fly-in');
  settingsPanel.style.display = "block";
  settingsPanel.style.position = "absolute";
  settingsPanel.addEventListener('animationend', function() {
    const panels = Array.from(mainRight.children).slice(1); // not the germsfox child
    for (const panel of panels) {
      panel.style.display = "none";
    }
    settingsPanel.classList.remove('fly-in');
    settingsPanel.style.position = "relative";
  });
}

keyTester.addEventListener("click", function () {
  if (!testerWaiting) {
    startWaiting();
  } else {
    // clicking a second time will toggle it back off
    stopWaiting();
  }
});

function checkboxChanged() {
  const switcherEnabled = document.getElementById("enabledCheckbox").checked;
  const switcherWindowed = document.getElementById("windowedCheckbox").checked;

  chrome.storage.local.set(
    {
      switcherEnabled: switcherEnabled,
      switcherWindowed: switcherWindowed,
    },
    function () {
      console.log("Settings saved");
      updateAllSettings();
    }
  );
}

// why did i make these functions dude

function startedUsingTextBox() {
  // this will pause the tab switcher
  usingTextBox = true;
}

function stoppedUsingTextBox() {
  usingTextBox = false;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateSettings") {
    console.info("Updating settings");
    updateAllSettings();
  }
});

window.onclick = function (event) {
  if (event.target === settingsPanel) {
    stopWaiting();
    settingsPanel.style.display = "none";
  }
};

function keydown(event) {
  if (testerWaiting) {
    switcherKey[0] = event.keyCode;
    switcherKey[1] = event.key;

    chrome.storage.local.set({ switcherKey: switcherKey }, function () {
      console.log("Switcher key changes saved");
      updateAllSettings();
    });
    stopWaiting();
  } else if (
    !usingTextBox &&
    switcherEnabled &&
    (event.keyCode === switcherKey[0] || event.key === switcherKey[1])
  ) {
    if (switcherWindowed) {
      console.log("Switching windows!");
      chrome.runtime.sendMessage({ action: "switchWindows" });
    } else {
      console.log("Switching tabs!");
      chrome.runtime.sendMessage({ action: "switchTabs" });
    }
  }
}

function updateAllSettings() {
  // gota.io settings
  // for future reference, options are also available
  const settings = localStorage.getItem("keybinds");
  if (settings) {
    console.info("Settings key retrieved");
    const parsedSettings = JSON.parse(settings);
    // ex: feedKey = parsedSettings.keybinds.kEjectMass;
  } else {
    console.warn("Settings key either empty or not found");
  }

  // gotafox settings
  chrome.storage.local.get(
    [
      "switcherKey",
      "switcherEnabled",
      "switcherWindowed",
    ],
    function (settings) {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        return;
      }
      console.info("Gotafox settings retrieved.");
      switcherKey = settings.switcherKey || [65, "A"]; // default to [65, "A"] if switcherKey not found
      switcherEnabled = settings.switcherEnabled;
      switcherWindowed = settings.switcherWindowed;
    }
  );
}

function stopWaiting() {
  keyTester.style.backgroundColor = "#1e1a1e";
  keyTester.style.border = "2px solid #947995";
  keyTester.textContent = switcherKey[1].toUpperCase();
  testerWaiting = false;
}

function startWaiting() {
  keyTester.style.border = "2px solid white";
  keyTester.style.backgroundColor = "red";
  keyTester.textContent = " ";
  testerWaiting = true;
}
