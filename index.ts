import {killAll} from "chrome-launcher"
import { Logger } from "tslog";
import BatchController from "./src/batchController";
import Sites from "./src/siteTracker";

const log = new Logger();

process.on('SIGINT', () => {
  killAll();
});

process.on('beforeExit', () => {
  log.info('Finished')
})

export default async function execute(options) {
  if (options.clean) {
    Sites.clean();
  }
  const batcher = new BatchController(options);

  await batcher.processSites()
}