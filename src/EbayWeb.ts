class EbayWeb {
    html: string = '';

    loadItem(
        id: string,
        options?: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
    ) {
        this.load(this.generateItemUrl(id), options);
    }

    load(
        url: string,
        options?: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
    ) {
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

    private generateItemUrl(id: string) {
        return `https://www.ebay.com/itm/${id}`;
    }
}

function ebayWebTest() {
    const id = '156225213767';
    const ebayWeb = new EbayWeb();
    ebayWeb.loadItem(id);
    console.log(ebayWeb.getSignalText());
}
