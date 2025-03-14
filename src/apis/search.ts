import { getEbayAuthService } from "../authService.js";
import { SearchResult } from "../types.js";
import { createSearchParams } from "../utils.js";

type Sort = 'BestMatch';
type BuyingOption = 'FIXED_PRICE' | 'AUCTION' | 'BEST_OFFER' | 'CLASSIFIED_AD';
type Condition = 'NEW' | 'USED' | 'UNSPECIFIED';

interface Filter {
  sellers?: string[];
  itemLocationCountry?: string;
  buyingOptions?: BuyingOption[];
  conditions?: Condition[];
}

export interface Params {
  q: string
  /** 1-200. max result is 10,000 */
  limit: number;
  /** 0-9999 */
  offset: number;
  sort?: Sort;
  filter?: Filter;
}

export function createSearchUrl(params: Params) {
  const url = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

  const filter = createFilterString(params.filter);
  const searchParams = createSearchParams({
    ...params,
    sort: params.sort == 'BestMatch' ? undefined : params.sort,
    filter
  });
  return `${url}?${searchParams}`;
}

export function search(url: string): SearchResult {
  const service = getEbayAuthService();
  const token = service.getAccessToken();
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = JSON.parse(response.getContentText());
  return data;
}

function createFilterString(filter: Filter | undefined) {
  if (!filter) return undefined;
  const result = [];
  result.push(createFilterArrayString('sellers', filter.sellers));
  result.push(createFilterArrayString('buyingOptions', filter.buyingOptions));
  result.push(createFilterArrayString('conditions', filter.conditions));
  result.push(createFilterValueString('itemLocationCountry', filter.itemLocationCountry));
  return result.filter(Boolean).join(',');
}

function createFilterArrayString(key: string, values: string[] | undefined) {
  if (!values) return undefined;
  return `${key}:{${values.join('|')}}`
}

function createFilterValueString(key: string, value: string | undefined) {
  if (!value) return undefined;
  return `${key}:${value}`;
}