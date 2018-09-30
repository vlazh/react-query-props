import { History, Location } from 'history';
import { match as Match } from 'react-router';
import qs from 'qs';

export type QueryObject = Record<string, any>;

export type Options<Q> = qs.IParseOptions & {
  includeMatchParams?: boolean;
  transform?: (queryObject: QueryObject) => Q;
};

export const parserDefaultOptions: qs.IParseOptions = { ignoreQueryPrefix: true };

export function parseLocation<Q>(location: Location, match: Match<any>, options: Options<Q>): Q {
  const { includeMatchParams, transform, ...rest } = options;

  const queryObject: QueryObject = {
    ...qs.parse(location.search, { ...parserDefaultOptions, ...rest }),
    ...(includeMatchParams ? match.params : {}),
  };

  return transform ? transform(queryObject) : (queryObject as Q);
}

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
