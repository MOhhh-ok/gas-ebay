import { createSearchUrl } from "./search.js";

function test() {
  const url = createSearchUrl({
    filter: {
      sellers: ['1234567890'],
      buyingOptions: ['FIXED_PRICE'],
      conditions: ['NEW'],
      itemLocationCountry: 'JP'
    },
    q: 'test',
    limit: 10,
    offset: 0
  })
  console.log(url);
  console.log(decodeURIComponent(url));
}

test();