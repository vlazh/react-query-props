import React from 'react';
import { Location } from 'history';
import { match as Match, RouteComponentProps, Omit } from 'react-router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import qs from 'qs';
import { QueryObject, parserDefaultOptions } from './utils';

interface InjectedQueryMapperProps<Q extends QueryObject = {}> {
  query: Q;
}

export interface QueryMapperProps extends RouteComponentProps<any>, InjectedQueryMapperProps {}

type EjectedProps<P extends InjectedQueryMapperProps> = Omit<P, keyof InjectedQueryMapperProps>;

interface State<Q extends QueryObject = {}> {
  locationPath: string;
  queryString: string;
  queryObject: Q;
}

export interface WrappedComponent<P> {
  wrappedComponent: React.ComponentType<P>;
}

export type Options = qs.IParseOptions & {
  includeMatchParams?: boolean;
  transform?: (queryObject: QueryObject) => any;
};

/**
 * The higher-order component to map location.search to props.query plain object.
 */
export default function queryToProps<P extends QueryMapperProps>(options: Options = {}) {
  return <C extends React.ComponentType<P>>(
    Component: C
  ): React.ComponentClass<EjectedProps<P>> & WrappedComponent<EjectedProps<P>> => {
    class QueryMapper extends React.Component<P, State> {
      static displayName = `${queryToProps.name}(${Component.displayName ||
        Component.name ||
        (Component.constructor && Component.constructor.name) ||
        'Unknown'})`;

      static wrappedComponent: React.ComponentType<P> = Component;

      private static parseLocation(location: Location, match: Match<any>) {
        const { includeMatchParams, transform, ...rest } = options;

        const queryObject = {
          ...qs.parse(location.search, { ...parserDefaultOptions, ...rest }),
          ...(includeMatchParams ? match.params : {}),
        };

        return transform ? transform(queryObject) : queryObject;
      }

      static getDerivedStateFromProps(nextProps: Readonly<P>, prevState: State) {
        const { location, match } = nextProps;
        const { locationPath, queryString } = prevState;

        if (locationPath === location.pathname && queryString === location.search) {
          return null;
        }

        return {
          locationPath: location.pathname,
          queryString: location.search,
          queryObject: this.parseLocation(location, match),
        };
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
    hoistNonReactStatics<React.ComponentClass<P>, React.ComponentType<P>>(QueryMapper, Component);

    return QueryMapper as React.ComponentClass<EjectedProps<P>> &
      typeof QueryMapper &
      WrappedComponent<EjectedProps<P>>;
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
