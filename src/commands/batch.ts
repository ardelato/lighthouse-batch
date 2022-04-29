import { Command, Flags } from '@oclif/core'
import execute from "../batchExecutor"
import path from 'path';

export default class Batch extends Command {
  static description = 'Run Lighthouse on all passed sites for a given number of times'

  static examples = [
    `$ lh batch --file <file_name.txt> --times 5`,
    `$ lh batch --sites https://example.com https://google.com --times 5 --clean`,
  ]
  static flags = {
    sites: Flags.string({
      char: 's',
      description: 'Space delimited list of site urls to analyze with Lighthouse',
      multiple: true,
      exclusive: ["file"]
    }),
    file: Flags.string({
      char: 'f',
      description: 'An input file with a site url per-line to analyze with Lighthouse',
    }),
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
    formFactor: Flags.string({
      description: 'Compare the sites with a specified form factor',
      default: 'desktop',
      options: ['desktop', 'mobile']
    }),
    clean: Flags.boolean({
      description: 'Removes all processed sites in temp database, forcing a clean audit of all passed sites',
      default: false
    }),
    help: Flags.help()
  }

  async catch(error) {
    console.error(error.message);
  }

  async run() {
    const { flags } = await this.parse(Batch);
    if (!flags.sites && !flags.file) {
      this.error('Error: sites or file must be specified');
    }
    execute(flags)
  }
}