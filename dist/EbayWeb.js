"use strict";
//.x-ebay-signal
class EbayWeb {
    constructor() {
        this.html = '';
    }
    loadItem(id) {
        this.load(this.generateItemUrl(id));
    }
    load(url) {
        this.html = UrlFetchApp.fetch(url).getContentText();
    }
    getSignalText() {
        const xml = XmlService.parse(this.html);
        const root = xml.getRootElement();
        const elements = root.getChildren('div');
        for (const element of elements) {
            if (element.getAttribute('class').getValue() === 'x-ebay-signal') {
                return element.getText();
            }
        }
        return null;
    }
    generateItemUrl(id) {
        return `https://www.ebay.com/itm/${id}`;
    }
}
