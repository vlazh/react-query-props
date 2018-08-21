import React from 'react';
import { Location } from 'history';
import { match as Match } from 'react-router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import qs from 'qs';

export interface Props<Q = any> {
  location: Location;
  match?: Match<any>;
  query: Q;
}

interface QueryMapperClass<P> {
  wrappedComponent: React.ComponentType<P>;
}

export type Options = qs.IParseOptions & {
  includeMatchParams?: boolean;
  transform?: (queryObject: Record<string, any>) => any;
};

const defaultOptions: qs.IParseOptions = { ignoreQueryPrefix: true };

/**
 * The higher-order component to map location.search to props.query plain object.
 */
export default function queryProps<P extends Props>(options: Options = {}) {
  return <C extends React.ComponentClass<P>>(Component: C): C => {
    class QueryMapper extends React.Component<P> {
      static displayName = `${queryProps.name}(${Component.displayName ||
        Component.name ||
        (Component.constructor && Component.constructor.name) ||
        'Unknown'})`;

      static wrappedComponent: React.ComponentType<P> = Component;

      private static parseLocation(location: Location, match?: Match<any>) {
        const { includeMatchParams, transform, ...rest } = options;

        const queryObject = {
          ...qs.parse(location.search, { ...defaultOptions, ...rest }),
          ...(includeMatchParams && match ? match.params : {}),
        };

        return transform ? transform(queryObject) : queryObject;
      }

      private static initState({ location, match }: P) {
        return {
          locationPath: location.pathname,
          queryString: location.search,
          queryObject: this.parseLocation(location, match),
        };
      }

      state = QueryMapper.initState(this.props);

      componentWillReceiveProps(nextProps: P) {
        const { locationPath, queryString } = this.state;

        if (
          locationPath === nextProps.location.pathname &&
          queryString === nextProps.location.search
        ) {
          return;
        }

        this.setState({
          locationPath: nextProps.location.pathname,
          queryString: nextProps.location.search,
          queryObject: QueryMapper.parseLocation(nextProps.location, nextProps.match),
        });
      }

      render() {
        const { query: _, ...rest } = this.props as any; // https://github.com/Microsoft/TypeScript/issues/16780
        const { queryObject } = this.state;
        return <Component query={queryObject} {...rest} />;
      }
    }

    // Static fields from component should be visible on the generated QueryMapper
    hoistNonReactStatics(QueryMapper, Component);

    return QueryMapper as C & QueryMapperClass<P> & typeof QueryMapper;
  };
}
