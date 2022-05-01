import SimplDB from 'simpl.db'

const db = new SimplDB.Database({
  collectionsFolder: './tmp/',
  collectionTimestamps: true,
  dataFile: '/tmp/backup.json',
  tabSize: 2
});

export type MappedSiteMetric = Map<string, {
  'desktop'?: Map<string, number>,
  'mobile'?: Map<string, number>
}>

export type SiteMetric = {
  url: string,
  scores: {
    "desktop": {}
    "mobile": {}
  }
}

export default class SiteMetrics {
  private static sitesDB = db.createCollection<SiteMetric>('metrics')

  public static createOrUpdate(site: SiteMetric) {
    if (SiteMetrics.entryExists(site)) {
      this.update(site);
    } else {
      this.create(site);
    }
  }

  public static create(site: SiteMetric) {
    this.sitesDB.create(site)
  }

  public static update(site: SiteMetric, ) {
    this.sitesDB.update(
      s => s = { ...s, ...site },
      s => s.url === site.url
    )
  }

  public static clean() {
    this.sitesDB.remove()
  }

  private static entryExists(site: SiteMetric) {
    return this.sitesDB.has(s => s.url == site.url)
  }
}