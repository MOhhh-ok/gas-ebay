enum EbayFindingAPIOperations {
    FindItemsByKeywords = 'findItemsByKeywords',
    FindItemsAdvanced = 'findItemsAdvanced',
    FindCompletedItems = 'findCompletedItems', // 提供終了
}

const EBAY_FINDING_API_FILTER_KEYS = [
    'Seller',
    'AvailableTo',
    'SoldItemsOnly',
] as const;

type EbayFindingAPIFilters = Partial<
    Record<(typeof EBAY_FINDING_API_FILTER_KEYS)[number], string>
>;

type EbayFindingAPIOptions = {
    ['OPERATION-NAME']?: string;
    ['SERVICE-VERSION']?: string;
    ['SECURITY-APPNAME']?: string;
    ['RESPONSE-DATA-FORMAT']?: string;
    ['REST-PAYLOAD']?: string;
    ['paginationInput.pageNumber']?: number;
    ['keywords']?: string;
} & Record<string, string>;

type EbayFindingAPIResponse = {
    ack: ['Failure' | 'PartialFailure' | 'Success' | 'Warning'];
    version: [string];
    timestamp: [string];
    searchResult: [{ '@count': string; item: any[] }];
    paginationOutput: [
        {
            pageNumber: [string];
            entriesPerPage: [string];
            totalPages: [string];
            totalEntries: [string];
        }
    ];
    itemSearchURL: [string];
    errorMessage?: any; // object. not string
} & Record<string, any>;

type EbayFindingServiceArgs = {
    operation: EbayFindingAPIOperations;
    options?: EbayFindingAPIOptions;
    filters: EbayFindingAPIFilters;
    pageNum?: number;
    fetchAllPages?: boolean;
};

/**
 * eBay用クラス
 * FindingAPI 5,000 API calls per day
 */
class EbayFindingAPI {
    private appId: string | undefined | null;
    private devId: string | undefined | null;
    private certId: string | undefined | null;
    private serviceVersion: string;

    constructor(args: {
        appId?: string | null;
        devId?: string | null;
        certId?: string | null;
    }) {
        this.appId = args.appId;
        this.devId = args.devId;
        this.certId = args.certId;
        this.serviceVersion = '1.13.0'; // normally use latest version
    }

    /** Find */
    findingService(args: EbayFindingServiceArgs): any[] {
        const { operation, options, filters, pageNum, fetchAllPages } = args;
        const ops: EbayFindingAPIOptions = Object.assign(options || {}, {
            'OPERATION-NAME': operation,
            'SERVICE-VERSION': this.serviceVersion,
            'SECURITY-APPNAME': this.appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'paginationInput.pageNumber': pageNum || 1,
        });
        Object.assign(ops, this.makeItemFilters(filters));

        const url =
            'https://svcs.ebay.com/services/search/FindingService/v1?' +
            this.generateQueryString(ops);
        console.log(url);

        const fetchResult = UrlFetchApp.fetch(url, {
            //muteHttpExceptions:true,
        });
        const jsonData = JSON.parse(fetchResult.getContentText());

        const res: EbayFindingAPIResponse = jsonData[`${operation}Response`][0];
        const ack = res.ack[0];
        if (ack != 'Success') {
            throw new Error('データ取得に失敗しました。' + JSON.stringify(res));
        }

        const resultItems = res.searchResult[0].item || [];
        const pagination = res.paginationOutput[0];
        const retrievedPageNum = Number(pagination.pageNumber[0]);
        const totalPages = Number(pagination.totalPages[0]);

        console.log(
            JSON.stringify({
                result: resultItems.length,
                page: `${retrievedPageNum}/${totalPages}`,
            })
        );

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
    private makeItemFilters(filters: EbayFindingAPIFilters) {
        const result: Record<string, string> = {};
        const names = Object.keys(filters) as (keyof EbayFindingAPIFilters)[];

        for (let nIdx = 0; nIdx < names.length; nIdx++) {
            const name = names[nIdx];
            const value = filters[name];
            if (!name || !value) {
                throw new Error(
                    'name or value is empty. ' + JSON.stringify({ name, value })
                );
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
    private generateQueryString(obj: Record<string, string>) {
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
