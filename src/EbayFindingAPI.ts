type EbayFindingAPIOperation =
    | 'findItemsByKeywords'
    | 'findItemsAdvanced'
    | 'findCompletedItems'; // 提供終了

enum EbayFindingAPICondition {
    Used = 3000,
}

type EbayFindingAPIFilters = {
    Seller?: string;
    AvailableTo?: string;
    ListingType?:
        | 'Auction' // Not Buy It Now
        | 'AuctionWithBIN' // Buy It Now
        | 'Classified'
        | 'FixedPrice'
        | 'StoreInventory'
        | 'All';
    Condition?: EbayFindingAPICondition;
};

type EbayFindingAPIOptions = {
    ['OPERATION-NAME']?: EbayFindingAPIOperation;
    ['SERVICE-VERSION']?: string;
    ['SECURITY-APPNAME']?: string;
    ['RESPONSE-DATA-FORMAT']?: string;
    ['REST-PAYLOAD']?: string;
    ['paginationInput.pageNumber']?: number;
    ['keywords']?: string;
    ['sortOrder']?: 'BestMatch';
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
    operation: EbayFindingAPIOperation;
    options?: EbayFindingAPIOptions;
    filters: EbayFindingAPIFilters;
    pageNum?: number;
    fetchAllPages?: boolean;
    onPageRetrieved?: (args: {
        items: any[];
        pageNum: number;
        total: number;
    }) => void;
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
        const {
            operation,
            options,
            filters,
            pageNum,
            fetchAllPages,
            onPageRetrieved,
        } = args;
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
        const totalPages = Number(pagination.totalPages[0]); // 実際に取得できる数よりだいぶ多い

        console.log(
            JSON.stringify({
                result: resultItems.length,
                page: `${retrievedPageNum}/${totalPages}`,
                pagination,
            })
        );

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
    private makeItemFilters(filters: EbayFindingAPIFilters) {
        const result: Record<string, string> = {};
        const names = Object.keys(filters) as (keyof EbayFindingAPIFilters)[];

        let nIdx = 0;
        for (const name of names) {
            const value = filters[name];
            if (!name || !value) {
                continue;
            }

            result[`itemFilter(${nIdx}).name`] = name;
            result[`itemFilter(${nIdx}).value`] = value as any;
            nIdx++;
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
        operation: 'findItemsAdvanced',
        options: {
            sortOrder: 'BestMatch',
            keywords: 'watch',
        },
        filters: {
            Condition: EbayFindingAPICondition.Used,
            AvailableTo: 'US',
            ListingType: 'AuctionWithBIN',
        },
        fetchAllPages: true,
        onPageRetrieved: (args) => {
            console.log(args.pageNum, args.total);
        },
    });
    // console.log(items);
}
