// This script demonstrates automation logic for interacting with dynamic web interfaces.
// Selectors and text markers must be configured for the specific target environment.

const CONFIG = {
  SELECTORS: {
    itemsTab: ".items-tab-selector",
    item: ".item-selector",
    actionZone: ".action-zone-selector",
    continueButton: ".continue-button",
    enemy: ".enemy-element",
    actionButton: ".action-button"
  },

  TEXTS: {
    brokenState: "BROKEN_STATE_TEXT",
    success: "SUCCESS_TEXT",
    altSuccess: "ALT_SUCCESS_TEXT"
  },

  ASSETS: {
    pattern: "IMAGE_PATTERN"
  }
};

// Utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// MAIN COMMAND
const startAutomationCommand = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {

      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      let isPrimaryProcess = false;
      let isSecondaryProcess = false;
      let isPanelOpened = false;

      function getElementByText(selector, text) {
        return Array.from(document.querySelectorAll(selector))
          .find(el => el.textContent.includes(text));
      }

      async function clickContinue() {
        const btn = document.querySelector(CONFIG.SELECTORS.continueButton);
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }

      async function openPanel() {
        if (isPanelOpened) return true;

        const tab = getElementByText(CONFIG.SELECTORS.itemsTab, "TAB_TEXT");
        if (tab) {
          tab.click();
          isPanelOpened = true;
          return true;
        }

        await delay(3000);
        return false;
      }

      const itemPriority = [
        "high-tier-item",
        "mid-tier-item",
        "low-tier-item"
      ];

      function selectBestItem() {
        for (const itemName of itemPriority) {
          const item = getElementByText(CONFIG.SELECTORS.item, itemName);
          if (item) {
            item.click();
            return true;
          }
        }
        return false;
      }

      function isPatternPresent() {
        const images = Array.from(document.querySelectorAll("img"));
        return images.some(img => {
          const src = img.getAttribute("src");
          return src && src.includes(CONFIG.ASSETS.pattern);
        });
      }

      async function isSecondaryFinished() {
        const found = Array.from(document.body.querySelectorAll("*")).find(el =>
          el.textContent.includes(CONFIG.TEXTS.success) ||
          el.textContent.includes(CONFIG.TEXTS.altSuccess)
        );

        if (found) {
          await clickContinue();
          return true;
        }

        return false;
      }

      async function startPrimaryProcess() {
        if (isPrimaryProcess) return;

        isPrimaryProcess = true;

        while (isPrimaryProcess) {

          if (!(await openPanel())) {
            isPrimaryProcess = false;
            break;
          }

          if (!selectBestItem()) {
            await delay(5000);
            continue;
          }

          while (isPrimaryProcess) {

            if (isPatternPresent()) {
              while (isPrimaryProcess && isPatternPresent()) {
                await delay(1000);
              }
            }

            const broken = document.body.textContent.includes(CONFIG.TEXTS.brokenState);

            if (broken) {
              await delay(2000);

              if (!selectBestItem()) {
                await delay(5000);
                break;
              }

              continue;
            }

            const zone = document.querySelector(CONFIG.SELECTORS.actionZone);
            if (zone) {
              zone.click();
            }

            await clickContinue();
            await delay(300);
          }
        }
      }

      let secondaryInterval;

      async function startSecondaryProcess() {
        if (isSecondaryProcess) return;

        isSecondaryProcess = true;

        secondaryInterval = setInterval(async () => {
          const enemy = document.querySelector(CONFIG.SELECTORS.enemy);

          if (!enemy || (await isSecondaryFinished())) {
            stopSecondaryProcess();
            return;
          }

          const actionBtn = document.querySelector(CONFIG.SELECTORS.actionButton);
          if (actionBtn) {
            actionBtn.click();
          }

        }, 1000);
      }

      function stopPrimaryProcess() {
        isPrimaryProcess = false;
      }

      function stopSecondaryProcess() {
        isSecondaryProcess = false;
        clearInterval(secondaryInterval);
      }

      const observer = new MutationObserver(() => {
        const enemy = document.querySelector(CONFIG.SELECTORS.enemy);

        if (enemy && !isSecondaryProcess) {
          startSecondaryProcess();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      window.startPrimaryProcess = startPrimaryProcess;
      window.stopPrimaryProcess = stopPrimaryProcess;
      window.startSecondaryProcess = startSecondaryProcess;
      window.stopSecondaryProcess = stopSecondaryProcess;

      startPrimaryProcess();
    }
  });
};

// STOP COMMANDS
const stopPrimaryCommand = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (window.stopPrimaryProcess) {
        window.stopPrimaryProcess();
      }
    }
  });
};

const stopSecondaryCommand = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (window.stopSecondaryProcess) {
        window.stopSecondaryProcess();
      }
    }
  });
};

// UI bindings
document.getElementById("startFishing").addEventListener("click", startAutomationCommand);
document.getElementById("stopFishing").addEventListener("click", stopPrimaryCommand);
document.getElementById("stopBattle").addEventListener("click", stopSecondaryCommand);