/* ---------- PREFS ---------- */

let PREFS = null;

async function initPrefs() {
  const res = await chrome.storage.local.get("prefs");

  if (res.prefs) {
    PREFS = res.prefs;
  } else {
    PREFS = defaultPrefs();
    await chrome.storage.local.set({ prefs: PREFS });
  }
}

function defaultPrefs() {
  return {
    siteList: [
      "facebook.com",
      "youtube.com",
      "twitter.com",
      "reddit.com",
      "netflix.com",
      "instagram.com"
    ],
    durations: { work: 60, break: 60 },
    shouldRing: true,
    clickRestarts: false,
    whitelist: false,
    showNotifications: true
  };
}

/* ---------- ICONS ---------- */

const ICONS = {
  CURRENT: {
    work: "icons/work.png",
    break: "icons/break.png"
  },
  PENDING: {
    work: "icons/work_pending.png",
    break: "icons/break_pending.png"
  }
};

const BADGE_COLORS = {
  work: [192,0,0,255],
  break: [0,192,0,255]
};

/* ---------- DOMAIN CHECK ---------- */

function shouldBlock(url) {

  if (!url || !PREFS) return false;

  try {
    const host = new URL(url).hostname;

    const match = PREFS.siteList.some(
      s => host === s || host.endsWith("." + s)
    );

    return PREFS.whitelist ? !match : match;

  } catch {
    return false;
  }
}

/* ---------- OFFSCREEN ALARM ---------- */

async function playAlarm() {

  if (!chrome.offscreen) return;

  const exists = await chrome.offscreen.hasDocument();

  if (!exists) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play pomodoro alarm"
    });
  }

  setTimeout(()=>{
    chrome.runtime.sendMessage({ type:"PLAY_ALARM" });
  },150);
}

/* ---------- POMODORO ---------- */

function Pomodoro() {

  this.running = false;
  this.mode = "work";
  this.endTime = null;

  this.start = () => {

    const duration = PREFS.durations[this.mode];

    this.endTime = Date.now() + duration * 1000;

    chrome.alarms.create("pomodoroTimer",{ when:this.endTime });

    this.running = true;

    chrome.action.setIcon({ path: ICONS.CURRENT[this.mode] });

    chrome.action.setBadgeBackgroundColor({
      color: BADGE_COLORS[this.mode]
    });

    if (this.mode === "work") blockAllTabs();
    else unblockAllTabs();
  };

  this.stop = () => {

    this.running = false;
    this.endTime = null;

    chrome.action.setBadgeText({ text:"" });

    chrome.action.setIcon({ path: ICONS.PENDING.work });

    unblockAllTabs();
  };
}

const mainPomodoro = new Pomodoro();

/* ---------- BADGE LOOP ---------- */

setInterval(()=>{

  if (!mainPomodoro.running || !mainPomodoro.endTime) return;

  const remaining = Math.max(
    0,
    Math.floor((mainPomodoro.endTime - Date.now())/1000)
  );

  chrome.action.setBadgeText({
    text: remaining>=60
      ? Math.ceil(remaining/60)+"m"
      : remaining+"s"
  });

},1000);

/* ---------- CLICK ---------- */

chrome.action.onClicked.addListener(async ()=>{

  await initPrefs();

  if (!mainPomodoro.running) {
    mainPomodoro.mode="work";
    mainPomodoro.start();
  }
  else if (PREFS.clickRestarts) {
    mainPomodoro.start();
  }

});

/* ---------- ALARM ---------- */

chrome.alarms.onAlarm.addListener(async alarm=>{

  if (alarm.name !== "pomodoroTimer") return;
  if (!mainPomodoro.running) return;

  mainPomodoro.endTime = null;
  chrome.action.setBadgeText({ text:"" });

  if (PREFS.shouldRing) {
    await playAlarm();
  }

  if (mainPomodoro.mode === "work") {

    setTimeout(()=>{
      if (!mainPomodoro.running) return;
      mainPomodoro.mode="break";
      mainPomodoro.start();
    },4500);

  } else {

    setTimeout(()=>{
      mainPomodoro.stop();
    },4500);

  }

});

/* ---------- TAB BLOCKING ---------- */

chrome.tabs.onUpdated.addListener((tabId,info,tab)=>{

  if (info.status !== "complete") return;
  if (!mainPomodoro.running) return;
  if (mainPomodoro.mode !== "work") return;
  if (!shouldBlock(tab.url)) return;

  chrome.scripting.executeScript({
    target:{ tabId },
    files:["content_scripts/block.js"]
  }).catch(()=>{});

});

function blockAllTabs() {

  chrome.tabs.query({},tabs=>{
    tabs.forEach(tab=>{
      if (shouldBlock(tab.url)) {
        chrome.scripting.executeScript({
          target:{ tabId:tab.id },
          files:["content_scripts/block.js"]
        }).catch(()=>{});
      }
    });
  });

}

function unblockAllTabs() {

  chrome.tabs.query({},tabs=>{
    tabs.forEach(tab=>{
      chrome.scripting.executeScript({
        target:{ tabId:tab.id },
        files:["content_scripts/unblock.js"]
      }).catch(()=>{});
    });
  });

}

/* ---------- INIT ---------- */

initPrefs();