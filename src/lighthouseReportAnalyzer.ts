import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

export type AuditScore = {
  time: number,
  weight: number
}

export type LighthouseMetrics = {
    performance: number,
    firstContentfulPaint: AuditScore,
    largestContentfulPaint: AuditScore,
    cumulativeLayoutShift: AuditScore,
    speedIndex: AuditScore,
    interactive: AuditScore,
    totalBlockingTime: AuditScore,
}

export class LighthouseAnalyzer {
  results: Result;
  score: LighthouseMetrics

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
      largestContentfulPaint: this.getLCPAuditScore(),
      cumulativeLayoutShift: this.getCLSAuditScore(),
      speedIndex: this.getSIAuditScore(),
      interactive: this.getTTIAuditScore(),
      totalBlockingTime: this.getTBTAuditScore(),
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
  getSIAuditScore(): AuditScore {
    const audit = 'speed-index'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
  }

  // Largest Contentful Paint
  getLCPAuditScore(): AuditScore {
    const audit = 'largest-contentful-paint'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
  }

  // Interactive
  getTTIAuditScore(): AuditScore {
    const audit = 'interactive'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
  }

  // Total Blocking Time
  getTBTAuditScore() {
    const audit = 'total-blocking-time'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
  }

  // Cumulative Layout Shift
  getCLSAuditScore(): AuditScore {
    const audit = 'cumulative-layout-shift'
    return {
      time: this.getAuditTimeInSeconds
        (audit),
      weight: this.getAuditWeight(audit)
    }
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