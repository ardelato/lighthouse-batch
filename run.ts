import { Command, Flags } from '@oclif/core'
import execute from "./index"
import path from 'path';

class LighthouseBatcher extends Command {
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
      default: `${path.dirname(require.main?.filename || '')}/reports`,
      parse: async input => `${path.dirname(require.main?.filename || '')}/${input}`
    }),
    verbose: Flags.boolean({
      char: 'f',
      description: 'Enable Verbose logging',
      default: false
    }),
    times: Flags.integer({
      char: 't',
      description: 'Number of times to run Lighthouse on each url passed',
      default: 1
    }),
    params: Flags.string({
      char: 'p',
      description: 'Extra parameters to pass to lighthouse cli for each execution e.g. -p "--perf --quiet"'
    }),
    clean: Flags.boolean({
      description: 'Removes all processed sites in temp database, forcing a clean audit',
      default: false
    }),
    help: Flags.help()
  }

  async catch(error) {
    console.error(error.message);
  }

  async run() {
    const { flags } = await this.parse(LighthouseBatcher);
    if (!flags.sites && !flags.file) {
      this.error('Error: sites or file must be specified');
    }
    execute(flags)
  }
}

LighthouseBatcher.run()