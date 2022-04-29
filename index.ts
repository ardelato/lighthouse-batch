import {killAll} from "chrome-launcher"
import { Logger } from "tslog";
import BatchController from "./batchController";

const log = new Logger({});

process.on('SIGINT', () => {
  killAll();
});

process.on('beforeExit', () => {
  log.info('Finished')
})

export default async function execute(options) {
  const batcher = new BatchController();
  batcher.parseAndqueueUpSites(options.file)
}