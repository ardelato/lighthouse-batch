import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

export class LighthouseAnalyzer {
  results: Result;
  score: {
    performance: number,

  }

  constructor (file: string) {
    const filePath = resolve(file)
    const content = readFileSync(filePath, 'utf8')
    this.results = JSON.parse(content)
    this.score = {
      performance: this.getPerformanceScore()
    }
  }

  getURL() {
    return this.results.requestedUrl
  }

  getFormFactor() {
    return this.results.configSettings.formFactor
  }

  getScore() {

  }

  getPerformanceScore() {

  }

  // First Contentful Paint
  getFCPTime() {
    const timing = this.results.audits["first-contentful-paint"].numericValue ?? 0

    return Math.floor(timing)
  }

  // Speed Index
  getSIScore() {

  }

  // Largest Contentful Paint
  getLCPScore() {

  }

  // Interactive
  getTTIScore() {

  }

  // Total Blocking Time
  getTBTScore() {

  }

  // Cumulative Layout Shift
  getCLSScore() {

  }

}