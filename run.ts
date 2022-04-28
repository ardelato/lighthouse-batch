import { Command } from 'commander/esm.mjs';
import execute from './index.js'

const program = new Command;

program
  .option('-s, --sites [sites...]', 'Space delimited list of site urls to analyze with Lighthouse', [])
  .option('-f, --file [path]', 'an input file with a site url per-line to analyze with Lighthouse')
  .option('-p, --params <params>', 'extra parameters to pass to lighthouse cli for each execution e.g. -p "--perf --quiet"')
  .option('-o, --out [out]', `the output folder to place reports, defaults to './report/lighthouse/'`)
  .option('-v, --verbose', 'enable verbose logging')
  .option('-t, --times <number>', 'if specified, will run lighthouse on each url passed N times, otherwise will only run once',1)
  .parse(program.argv)

execute(program.opts())