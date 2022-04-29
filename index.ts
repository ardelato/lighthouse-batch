import LightHouseRunner from "./lighthouseRunner";
import {killAll} from "chrome-launcher"
import ChromeRunner from "./chromeRunner";

process.on('SIGINT', () => {
  killAll();
});

(async () => {
  const chrome = new ChromeRunner();
  const port = await chrome.start();

  const lh = new LightHouseRunner('./report/', 'https://www.google.com', port, 'desktop')

  try {
    await lh.start();
  } catch (e) {
    console.error(e);
  }

  await chrome.stop();
})();