#!/usr/bin/env node
'use strict'

import { Command, Option } from 'commander/esm.mjs';
import execute from './index.js'

const program = new Command();

program
  .addOption(new Option('-s, --sites [sites...]', 'Space delimited list of site urls to analyze with Lighthouse', []))
  .addOption(new Option('-f, --file [path]', 'an input file with a site url per-line to analyze with Lighthouse'))
  .addOption(new Option('-o, --out [out]', `the output folder to place reports, defaults to './report/lighthouse/'`))
  .addOption(new Option('-t, --times <number>', 'if specified, will run lighthouse on each url passed N times, otherwise will only run once',1))
  .addOption(new Option('-r, --role <string>','Type of worker to run as').choices(['standalone','publisher','consumer']).makeOptionMandatory(true))

program.parse()

execute(program.opts())