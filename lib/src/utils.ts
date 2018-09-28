import { History } from 'history';
import qs from 'qs';

export type QueryObject = Record<string, any>;

export const parserDefaultOptions: qs.IParseOptions = { ignoreQueryPrefix: true };

export function mergeQuery(
  history: History,
  query: QueryObject,
  parserOptions: qs.IParseOptions = parserDefaultOptions
) {
  const currentQuery = qs.parse(history.location.search, parserOptions);
  // Merge current query with choosed params
  return qs.stringify({ ...currentQuery, ...query }, { encode: false });
}

export function updateLocation(
  history: History,
  query: QueryObject,
  parserOptions: qs.IParseOptions = parserDefaultOptions
) {
  history.push({
    pathname: history.location.pathname,
    search: mergeQuery(history, query, parserOptions),
  });
}
