import { History } from 'history';
import qs from 'qs';

export type QueryObject = Record<string, any>;

export function mergeQuery(history: History, query: QueryObject) {
  const currentQuery = qs.parse(history.location.search, { ignoreQueryPrefix: true });
  // Merge current query with choosed params
  return qs.stringify({ ...currentQuery, ...query }, { encode: false });
}

export function updateLocation(history: History, query: QueryObject) {
  history.push({ pathname: history.location.pathname, search: mergeQuery(history, query) });
}
