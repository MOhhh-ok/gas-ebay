//.x-ebay-signal
class EbayWeb {
    html: string = '';

    loadItem(id: string) {
        this.load(this.generateItemUrl(id));
    }

    load(url: string) {
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

    private generateItemUrl(id: string) {
        return `https://www.ebay.com/itm/${id}`;
    }
}
