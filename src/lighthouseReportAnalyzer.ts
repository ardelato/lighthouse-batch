import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

export class LighthouseAnalyzer {
  results: Result;

  constructor (file: string) {
    const filePath = resolve(file)
    const content = readFileSync(filePath, 'utf8')
    this.results = JSON.parse(content)
  }
}