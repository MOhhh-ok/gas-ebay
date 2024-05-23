const MyEbayOperations = {
    findItemsByKeywords: 'findItemsByKeywords',
    findItemsAdvanced: 'findItemsAdvanced',
    findCompletedItems: 'findCompletedItems', //提供終了
};

/**
 * eBay用クラス
 * FindingAPI 5,000 API calls per day
 */
class Ebay {
    private appId: string;
    private devId: string | undefined;
    private certId: string | undefined;
    private serviceVersion: string;

    constructor(args: { appId: string; devId?: string; certId?: string }) {
        this.appId = args.appId;
        this.devId = args.devId;
        this.certId = args.certId;
        this.serviceVersion = '1.13.0'; // normally use latest version
    }

    /**
     * GETパラメータ生成
     */
    queryString(obj: Record<string, string>) {
        const result = [];
        for (let [key, value] of Object.entries(obj)) {
            result.push(`${key}=${encodeURI(value)}`);
        }
        return result.join('&');
    }

    /**
     * フィルターアイテム群生成
     */
    makeFilters(
        filters: Record<string, string> = { filterName: 'filterValues' }
    ) {
        const result: Record<string, string> = {};
        const names = Object.keys(filters);

        for (let nIdx = 0; nIdx < names.length; nIdx++) {
            const name = names[nIdx];
            const value = filters[name];

            result[`itemFilter(${nIdx}).name`] = name;
            result[`itemFilter(${nIdx}).value`] = value;
            // for (let vIdx = 0; vIdx < values.length; vIdx++) {
            //   const value = values[vIdx];
            //   result[`itemFilter(${nIdx}).value(${vIdx})`] = value;
            // }
        }
        return result;
    }

    /** Find */
    findingService(
        operation = '',
        ops = {},
        filters = {},
        targetPageNum = 1
    ): any[] {
        ops = Object.assign(ops, {
            'OPERATION-NAME': operation,
            'SERVICE-VERSION': this.serviceVersion,
            'SECURITY-APPNAME': this.appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'paginationInput.pageNumber': targetPageNum,
        });
        ops = Object.assign(ops, this.makeFilters(filters));

        const url =
            'https://svcs.ebay.com/services/search/FindingService/v1?' +
            this.queryString(ops);
        Logger.log(url);

        const fetchResult = UrlFetchApp.fetch(url, {
            //muteHttpExceptions:true,
        });
        const jsonData = JSON.parse(fetchResult.getContentText());

        const res = jsonData[`${operation}Response`][0];
        const ack = res.ack[0];
        if (ack != 'Success') {
            throw new Error('データ取得に失敗しました。' + JSON.stringify(res));
        }
        const resultItems = res.searchResult[0].item || [];
        const pagenation = res.paginationOutput[0];
        const pageNum = pagenation.pageNumber[0] - 0;
        const totalPages = pagenation.totalPages[0] - 0;

        Logger.log(
            JSON.stringify({
                result: resultItems.length,
                page: `${pageNum}/${totalPages}`,
            })
        );

        /** 100ページまでしか取れない */
        if (pageNum < totalPages && pageNum < 100) {
            return [
                ...resultItems,
                ...this.findingService(operation, ops, filters, pageNum + 1),
            ];
        }

        return resultItems;
    }
}

// function myEbayTest() {
//     const aaa = new Ebay();
//     const items = aaa.findingService(
//         MyEbayOperations.findItemsAdvanced,
//         {
//             //'keywords': 'guitar',
//             itemId: '165956979408',
//         },
//         {
//             //'Seller': 'kanamusicwholesale',
//             // 'keywords': 'Garmin+nuvi+1300+Automotive+GPS+Receiver',
//             // 'categoryId': 156955,
//             //'SoldItemsOnly': 'true',
//             // 'itemFilter(1).name': 'AvailableTo',
//             // 'itemFilter(1).value': 'US',
//         }
//     );
//     const counter: Record<any, number> = {};
//     for (let item of items) {
//         const state = item.sellingStatus[0].sellingState[0];
//         if (!counter[state]) {
//             counter[state] = 0;
//         }
//         counter[state]++;
//     }

//     Logger.log(counter);
// }
