import LightHouseRunner from "./lighthouseRunner";
import {killAll} from "chrome-launcher"
import ChromeRunner from "./chromeRunner";
import { Logger } from "tslog";

const log = new Logger({});

process.on('SIGINT', () => {
  killAll();
});

process.on('beforeExit', () => {
  log.info('Finished')
})

async function main(){
  log.info('Starting ChromeRunner')
  const chrome = new ChromeRunner();
  const port = await chrome.start();

  const lh = new LightHouseRunner('./report/', 'https://www.google.com', port, 'desktop')

  log.info('Starting Lighthouse')
  await lh.start();
  log.info('Finished Lighthouse, killing ChromeRunner')
  await chrome.stop();
}

main();