import { Command, Flags } from '@oclif/core'
import { executeABBatch } from "../batchExecutor"
import path from 'path';

export default class ABBatcher extends Command {
  static description = 'Run Lighthouse to compare results against a base site'

  static examples = [
    `$ lh abBatch https://prod.google.com https://dev.google.com --pathsFile paths.txt --times 5`,
  ]

  static args = [
    {
      name: 'baselineURL',
      required: true,
      description: 'The URL to compare results against',
    },
    {
      name: 'comparisonURL',
      required: true,
      description: 'The other URL to compare results with'
    }
  ]

  static flags = {
    output: Flags.string({
      char: 'o',
      description: 'The output folder to place reports',
      default: `${path.resolve('./')}/reports`,
      parse: async input => `${path.resolve('./')}/${input}`
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable Verbose logging',
      default: false
    }),
    times: Flags.integer({
      char: 't',
      description: 'Number of times to run Lighthouse on each url passed',
      default: 1
    }),
    clean: Flags.boolean({
      description: 'Removes all processed sites in temp database, forcing a clean audit of all passed sites',
      default: false
    }),
    formFactor: Flags.string({
      description: 'Compare the sites with a specified form factor',
      default: 'both',
      options: ['desktop', 'mobile', 'both']
    }),
    pathsFile: Flags.string({
      description: 'A text file that contains additional paths to iterator through for both sites, if none specified, will just run on the urls passed'
    }),
    help: Flags.help()
  }

  async catch(error) {
    console.error(error.message);
  }

  async run() {
    const { args, flags } = await this.parse(ABBatcher);
    executeABBatch({...args, ...flags})
  }
}