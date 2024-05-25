"use strict";
class EbayWeb {
    constructor() {
        this.html = '';
    }
    loadItem(id, options) {
        this.load(this.generateItemUrl(id), options);
    }
    load(url, options) {
        this.html = UrlFetchApp.fetch(url, options || {}).getContentText();
    }
    getSignalText() {
        const targetClass = 'x-ebay-signal';
        // @ts-ignore
        const $ = Cheerio.load(this.html);
        const element = $(`.${targetClass}`).first();
        if (element.length) {
            return element.text();
        }
        return null;
    }
    generateItemUrl(id) {
        return `https://www.ebay.com/itm/${id}`;
    }
}
function ebayWebTest() {
    const id = '156225213767';
    const ebayWeb = new EbayWeb();
    ebayWeb.loadItem(id);
    console.log(ebayWeb.getSignalText());
}
