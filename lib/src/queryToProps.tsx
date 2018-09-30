import React from 'react';
import { RouteComponentProps, Omit } from 'react-router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { QueryObject, Options, parseLocation } from './utils';

interface InjectedQueryMapperProps<Q extends QueryObject> {
  query: Q;
}

export interface QueryMapperProps<Q extends QueryObject>
  extends RouteComponentProps<any>,
    InjectedQueryMapperProps<Q> {}

type EjectedProps<P extends InjectedQueryMapperProps<any>> = Omit<
  P,
  keyof InjectedQueryMapperProps<any>
>;

interface State<Q extends QueryObject> {
  locationPath: string;
  queryString: string;
  queryObject: Q;
}

export interface WrappedComponent<P> {
  wrappedComponent: React.ComponentType<P>;
}

/**
 * The higher-order component to map location.search to props.query plain object.
 */
export default function queryToProps<P extends QueryMapperProps<Q>, Q extends QueryObject = {}>(
  options: Options<Q> = {}
) {
  return <C extends React.ComponentType<P>>(
    Component: C
  ): React.ComponentClass<EjectedProps<P>> & WrappedComponent<EjectedProps<P>> => {
    class QueryMapper extends React.Component<P, State<Q>> {
      static displayName = `${queryToProps.name}(${Component.displayName ||
        Component.name ||
        (Component.constructor && Component.constructor.name) ||
        'Unknown'})`;

      static wrappedComponent: React.ComponentType<P> = Component;

      static getDerivedStateFromProps(nextProps: Readonly<P>, prevState: State<Q>) {
        const { location, match } = nextProps;
        const { locationPath, queryString } = prevState;

        if (locationPath === location.pathname && queryString === location.search) {
          return null;
        }

        return {
          locationPath: location.pathname,
          queryString: location.search,
          queryObject: parseLocation(location, match, options),
        };
      }

      state: State<Q> = {
        locationPath: '',
        queryString: '',
        queryObject: {} as Q,
      };

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
