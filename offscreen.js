let audio;

chrome.runtime.onMessage.addListener(async (msg) => {

  if (msg.type !== "PLAY_ALARM") return;

  if (!audio) {
    audio = new Audio(chrome.runtime.getURL("ring.ogg"));
  }

  try {
    audio.currentTime = 0;
    await audio.play();
    console.log("Alarm sound playing");
  } catch (e) {
    console.log("Alarm play failed", e);
  }

});