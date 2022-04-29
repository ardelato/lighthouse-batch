import {killAll, launch} from 'chrome-launcher';

export default class ChromeRunner {
  static chromeFlags = ["--no-sandbox", "--headless", "--disable-gpu"];

  async start() {
    const chrome = await launch({
      chromeFlags: ChromeRunner.chromeFlags
    })

    return chrome.port;
  }

  async stop(): Promise<void> {
    await killAll();
  }
}
