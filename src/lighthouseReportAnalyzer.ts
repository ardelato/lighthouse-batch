import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

export class LighthouseAnalyzer {
  results: Result;
  score: {
    performance: number,
    firstContentfulPaint: number,
    largestContentfulPaint: number,
    cumulativeLayoutShift: number,
    speedIndex: number,
    interactive: number,
    totalBlockingTime: number,
  }

  constructor (file: string) {
    const filePath = resolve(file)
    const content = readFileSync(filePath, 'utf8')
    this.results = JSON.parse(content)
    this.score = this.getScores()
  }

  getURL() {
    return this.results.requestedUrl
  }

  getFormFactor() {
    return this.results.configSettings.formFactor
  }

  getScores() {
    return {
      performance: this.getPerformanceScore(),
      firstContentfulPaint: this.getFCPTime(),
      largestContentfulPaint: this.getLCPTime(),
      cumulativeLayoutShift: this.getCLSTime(),
      speedIndex: this.getSITime(),
      interactive: this.getTTITime(),
      totalBlockingTime: this.getTBTTime(),
    }
  }

  getPerformanceScore() {
    return this.results.categories.performance.score ?? 0
  }

  // First Contentful Paint
  getFCPTime() {
    return this.getAuditTimeInSeconds('first-contentful-paint')
  }

  // Speed Index
  getSITime() {
    return this.getAuditTimeInSeconds('speed-index')
  }

  // Largest Contentful Paint
  getLCPTime() {
    return this.getAuditTimeInSeconds('largest-contentful-paint')
  }

  // Interactive
  getTTITime() {
    return this.getAuditTimeInSeconds('interactive')
  }

  // Total Blocking Time
  getTBTTime() {
    return this.getAuditTimeInSeconds('total-blocking-time')
  }

  // Cumulative Layout Shift
  getCLSTime() {
    return this.getAuditTimeInSeconds('cumulative-layout-shift')
  }

  private getAuditTimeInSeconds(audit: string) {
    const timing = this.getAudit(audit).numericValue ?? 0

    return Math.floor(timing)
  }

  private getAudit(audit: string) {
    return this.results.audits[audit]
  }

}