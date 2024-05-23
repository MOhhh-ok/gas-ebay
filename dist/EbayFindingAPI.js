"use strict";
var EbayFindingAPIOperations;
(function (EbayFindingAPIOperations) {
    EbayFindingAPIOperations["FindItemsByKeywords"] = "findItemsByKeywords";
    EbayFindingAPIOperations["FindItemsAdvanced"] = "findItemsAdvanced";
    EbayFindingAPIOperations["FindCompletedItems"] = "findCompletedItems";
})(EbayFindingAPIOperations || (EbayFindingAPIOperations = {}));
const EBAY_FINDING_API_FILTER_KEYS = [
    'Seller',
    'AvailableTo',
    'SoldItemsOnly',
];
/**
 * eBay用クラス
 * FindingAPI 5,000 API calls per day
 */
class EbayFindingAPI {
    constructor(args) {
        this.appId = args.appId;
        this.devId = args.devId;
        this.certId = args.certId;
        this.serviceVersion = '1.13.0'; // normally use latest version
    }
    /** Find */
    findingService(args) {
        const { operation, options, filters, pageNum, fetchAllPages } = args;
        const ops = Object.assign(options || {}, {
            'OPERATION-NAME': operation,
            'SERVICE-VERSION': this.serviceVersion,
            'SECURITY-APPNAME': this.appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'paginationInput.pageNumber': pageNum || 1,
        });
        Object.assign(ops, this.makeItemFilters(filters));
        const url = 'https://svcs.ebay.com/services/search/FindingService/v1?' +
            this.generateQueryString(ops);
        console.log(url);
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
        const pagination = res.paginationOutput[0];
        const retrievedPageNum = Number(pagination.pageNumber[0]);
        const totalPages = Number(pagination.totalPages[0]);
        console.log(JSON.stringify({
            result: resultItems.length,
            page: `${retrievedPageNum}/${totalPages}`,
        }));
        if (!fetchAllPages) {
            return resultItems;
        }
        /** 100ページまでしか取れない */
        if (retrievedPageNum < totalPages && retrievedPageNum < 100) {
            return [
                ...resultItems,
                ...this.findingService({
                    operation,
                    options,
                    filters,
                    pageNum: retrievedPageNum + 1,
                    fetchAllPages: fetchAllPages,
                }),
            ];
        }
        return resultItems;
    }
    /**
     * フィルターアイテム群生成
     */
    makeItemFilters(filters) {
        const result = {};
        const names = Object.keys(filters);
        for (let nIdx = 0; nIdx < names.length; nIdx++) {
            const name = names[nIdx];
            const value = filters[name];
            if (!name || !value) {
                throw new Error('name or value is empty. ' + JSON.stringify({ name, value }));
            }
            result[`itemFilter(${nIdx}).name`] = name;
            result[`itemFilter(${nIdx}).value`] = value;
            // for (let vIdx = 0; vIdx < values.length; vIdx++) {
            //   const value = values[vIdx];
            //   result[`itemFilter(${nIdx}).value(${vIdx})`] = value;
            // }
        }
        return result;
    }
    /**
     * GETパラメータ生成
     */
    generateQueryString(obj) {
        const result = [];
        for (let [key, value] of Object.entries(obj)) {
            value = String(value).trim();
            if (!value) {
                continue;
            }
            result.push(`${key}=${encodeURI(value)}`);
        }
        return result.join('&');
    }
}
function ebayFindingAPITest() {
    const ebay = new EbayFindingAPI({
        appId: PropertiesService.getScriptProperties().getProperty('APP_ID'),
    });
    const items = ebay.findingService({
        operation: EbayFindingAPIOperations.FindItemsAdvanced,
        options: {
            SortOrder: 'StartTimeNewest', //効かない？
            keywords: 'Garmin nuvi 1300 Automotive GPS Receiver',
            // 'keywords': 'Garmin+nuvi+1300+Automotive+GPS+Receiver',
            // 'categoryId': 156955,
        },
        filters: {
            Seller: 'miyako_sunrise',
            AvailableTo: 'US',
            // 'SoldItemsOnly': 'true',
        },
    });
    console.log(items);
}
