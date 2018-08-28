import React from 'react';
import { Location } from 'history';
import { match as Match, RouteComponentProps, Omit } from 'react-router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import qs from 'qs';
import { QueryObject } from './utils';

interface InjectedQueryProps<Q extends QueryObject = {}> {
  query: Q;
}

export interface QueryProps extends RouteComponentProps<any>, InjectedQueryProps {}

type EjectedProps<P extends InjectedQueryProps> = Omit<P, keyof InjectedQueryProps>;

export interface IWrappedComponent<P> {
  wrappedComponent: React.ComponentType<P>;
}

export type Options = qs.IParseOptions & {
  includeMatchParams?: boolean;
  transform?: (queryObject: Record<string, any>) => any;
};

export const defaultOptions: qs.IParseOptions = { ignoreQueryPrefix: true };

/**
 * The higher-order component to map location.search to props.query plain object.
 */
export default function queryProps<P extends QueryProps>(options: Options = {}) {
  return <C extends React.ComponentType<P>>(
    Component: C
  ): React.ComponentClass<EjectedProps<P>> & IWrappedComponent<EjectedProps<P>> => {
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

    return QueryMapper as React.ComponentClass<EjectedProps<P>> &
      typeof QueryMapper &
      IWrappedComponent<EjectedProps<P>>;
  };
}

// interface MyProps {
//   query: any;
//   prop1: any;
// }
// type RoutedProps = MyProps & RouteComponentProps<any>;
// const F = queryProps()((props: RoutedProps) => <div>{props.children}</div>);
// const F = queryProps<RoutedProps>()(props => <div>{props.children}</div>);
// const f = <F />;
