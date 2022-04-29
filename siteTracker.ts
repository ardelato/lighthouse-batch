import SimplDB from 'simpl.db'

const db = new SimplDB.Database({
  collectionsFolder: './tmp/',
  collectionTimestamps: true,
  dataFile: '/tmp/backup.json',
  tabSize: 2
});

export type Site = {
  url: string,
  finished: boolean,
  errors: boolean
}

export default class Sites {
  private static sitesDB = db.createCollection<Site>('sites')

  public static createOrUpdate(site: Site) {
    if (Sites.entryExists(site)) {
      this.update(site);
    } else {
      this.create(site);
    }
  }

  public static create(site: Site) {
    this.sitesDB.create({ ...site })
  }

  public static update(site: Site) {
    this.sitesDB.update(
      s => s = { ...site },
      s => s.url === site.url
    )
  }

  public static clean() {
    this.sitesDB.remove()
  }

  private static entryExists(site: Site) {
    return this.sitesDB.has(s => s.url === site.url)
  }
}