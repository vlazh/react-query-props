import React from 'react';
import { Location } from 'history';
import { match as Match, RouteComponentProps, Omit } from 'react-router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import qs from 'qs';

interface InjectedProps<Q = any> {
  query: Q;
}

export interface Props extends RouteComponentProps<any>, InjectedProps {}

type EjectedProps<P extends Props> = Omit<P, keyof InjectedProps>;

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
  return <C extends React.ComponentType<P>>(
    Component: C
  ): React.ComponentType<EjectedProps<P>> & QueryMapperClass<EjectedProps<P>> => {
    class QueryMapper extends React.Component<P> {
      static displayName = `${queryProps.name}(${Component.displayName ||
        Component.name ||
        (Component.constructor && Component.constructor.name) ||
        'Unknown'})`;

      static wrappedComponent: React.ComponentType<P> = Component;

      private static parseLocation(location: Location, match: Match<any>) {
        const { includeMatchParams, transform, ...rest } = options;

        const queryObject = {
          ...qs.parse(location.search, { ...defaultOptions, ...rest }),
          ...(includeMatchParams ? match.params : {}),
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

      componentWillReceiveProps({ location, match }: P) {
        const { locationPath, queryString } = this.state;

        if (locationPath === location.pathname && queryString === location.search) {
          return;
        }

        this.setState({
          locationPath: location.pathname,
          queryString: location.search,
          queryObject: QueryMapper.parseLocation(location, match),
        });
      }

      render() {
        const { queryObject } = this.state;
        return React.createElement<P>(Component, {
          query: queryObject,
          ...(this.props as any), // https://github.com/Microsoft/TypeScript/issues/16780
        });
      }
    }

    // Static fields from component should be visible on the generated QueryMapper
    hoistNonReactStatics(QueryMapper, Component);

    return QueryMapper as React.ComponentType<EjectedProps<P>> &
      typeof QueryMapper &
      QueryMapperClass<EjectedProps<P>>;
  };
}
