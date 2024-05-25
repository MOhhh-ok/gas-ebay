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
        const { operation, options, filters, pageNum, fetchAllPages, onPageRetrieved, } = args;
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
        const totalPages = Number(pagination.totalPages[0]); // 実際に取得できる数よりだいぶ多い
        console.log(JSON.stringify({
            result: resultItems.length,
            page: `${retrievedPageNum}/${totalPages}`,
            pagination,
        }));
        if (onPageRetrieved) {
            onPageRetrieved({
                items: resultItems,
                pageNum: retrievedPageNum,
                total: totalPages,
            });
        }
        if (!fetchAllPages || resultItems.length == 0) {
            return resultItems;
        }
        /** 100ページまでしか取れない */
        if (retrievedPageNum < totalPages && retrievedPageNum < 100) {
            return [
                ...resultItems,
                ...this.findingService({
                    ...args,
                    pageNum: retrievedPageNum + 1,
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
        let nIdx = 0;
        for (const name of names) {
            const value = filters[name];
            if (!name || !value) {
                continue;
            }
            result[`itemFilter(${nIdx}).name`] = name;
            result[`itemFilter(${nIdx}).value`] = value;
            nIdx++;
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
            // SortOrder: 'StartTimeNewest', //効かない？
            keywords: 'watch',
            // 'keywords': 'Garmin+nuvi+1300+Automotive+GPS+Receiver',
            // 'categoryId': 156955,
        },
        filters: {
            // Seller: 'miyako_sunrise',
            AvailableTo: 'US',
            // 'SoldItemsOnly': 'true',
        },
        fetchAllPages: true,
        onPageRetrieved: (args) => {
            console.log(args.pageNum, args.total);
        },
    });
    // console.log(items);
}
