document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("options-form");
const siteListEl = document.getElementById("site-list");
const whitelistEl = document.getElementById("blacklist-or-whitelist");
const showNotificationsEl = document.getElementById("show-notifications");
const shouldRingEl = document.getElementById("should-ring");
const clickRestartsEl = document.getElementById("click-restarts");

const workDurationEl = document.getElementById("work-duration");
const breakDurationEl = document.getElementById("break-duration");

const resetBtn = document.getElementById("reset-btn");
const success = document.getElementById("save-successful");


function defaultPrefs(){
  return {
    siteList:["facebook.com","youtube.com","twitter.com","reddit.com"],
    durations:{ work:1500, break:300 },
    showNotifications:true,
    shouldRing:true,
    clickRestarts:false,
    whitelist:false
  };
}

async function loadPrefs(){

  let res = await chrome.storage.local.get("prefs");
  let prefs = res.prefs;

  if(!prefs){
    prefs = defaultPrefs();
    await chrome.storage.local.set({prefs});
  }

  fillUI(prefs);
}

function fillUI(prefs){
  siteListEl.value = prefs.siteList.join("\n");
  whitelistEl.selectedIndex = prefs.whitelist ? 1 : 0;

  showNotificationsEl.checked = prefs.showNotifications;
  shouldRingEl.checked = prefs.shouldRing;
  clickRestartsEl.checked = prefs.clickRestarts;

  workDurationEl.value = prefs.durations.work/60;
  breakDurationEl.value = prefs.durations.break/60;
}

form.addEventListener("submit", async(e)=>{
  e.preventDefault();

  const prefs = {
    siteList: siteListEl.value.split(/\r?\n/).filter(Boolean),
    durations:{
      work: parseInt(workDurationEl.value)*60,
      break: parseInt(breakDurationEl.value)*60
    },
    showNotifications: showNotificationsEl.checked,
    shouldRing: shouldRingEl.checked,
    clickRestarts: clickRestartsEl.checked,
    whitelist: whitelistEl.selectedIndex===1
  };

  await chrome.storage.local.set({prefs});

  success.style.display="block";
  setTimeout(()=>success.style.display="none",2000);
});

resetBtn.addEventListener("click", async()=>{
  const prefs = defaultPrefs();
  await chrome.storage.local.set({prefs});
  fillUI(prefs);
});

loadPrefs();

});