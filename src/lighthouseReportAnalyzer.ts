import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

type AuditScore = {
  time: number,
  weight: number
}

export class LighthouseAnalyzer {
  results: Result;
  score: {
    performance: number,
    firstContentfulPaint: AuditScore,
    largestContentfulPaint: AuditScore,
    cumulativeLayoutShift: AuditScore,
    speedIndex: AuditScore,
    interactive: AuditScore,
    totalBlockingTime: AuditScore,
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
      firstContentfulPaint: this.getFCPAuditScore(),
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
  getFCPAuditScore(): AuditScore {
    const audit = 'first-contentful-paint'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
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

  private getAuditWeight(auditRef: string): number {
    const audit = this.results.categories.peformance.auditRefs.find(audit => audit.id === auditRef)
    return audit?.weight ?? 0
  }

  private getAuditTimeInSeconds(audit: string) {
    const timing = this.getAudit(audit).numericValue ?? 0

    return Math.floor(timing)
  }

  private getAudit(audit: string) {
    return this.results.audits[audit]
  }

}