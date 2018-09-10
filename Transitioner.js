import React from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import {
  createNavigator,
  StackRouter,
  NavigationProvider,
} from "react-navigation";
const { timing } = Animated;

export const TransitionContext = React.createContext(null);

const interleaveArrays = (a, b) => {
  let aIndex = 0;
  let bIndex = 0;
  let out = [];
  const ensureItem = item => {
    if (item && out.indexOf(item) === -1) {
      out.push(item);
    }
  };
  while (aIndex <= a.length - 1 || aIndex <= b.length - 1) {
    ensureItem(a[aIndex]);
    aIndex += 1;
    ensureItem(b[bIndex]);
    bIndex += 1;
  }
  return out;
};

const getTransitionOwnerRouteKey = (fromState, toState) => {
  let transitionKey = fromState.routes[fromState.index].key;
  if (toState && toState.index >= fromState.index) {
    transitionKey = toState.routes[toState.index].key;
  }
  return transitionKey;
};

const defaultCreateTransition = transition => {
  //   const progress = new Animated.Value(0);
  return { ...transition };
};

const defaultRunTransition = ({ progress, fromState, toState }) => {
  //   return new Promise(resolve =>
  //     timing(progress, {
  //       toValue: 1,
  //       easing: Easing.linear,
  //       duration: 1000
  //     }).start(resolve)
  //   );
};

const getTransitionOptions = (fromState, toState, descriptors) => {
  const transitionKey = getTransitionOwnerRouteKey(fromState, toState);
  const descriptor = descriptors[transitionKey];
  return descriptor.options;
};

const getStateForNavChange = (props, state) => {
  const { navigation } = props;
  if (state.isTransitioning) {
    // never interrupt a transition in progress.
    return state;
  }
  const lastKey = state.navState.routes[state.navState.index].key;
  const nextKey = navigation.state.routes[navigation.state.index].key;
  if (lastKey === nextKey) {
    return state;
  }
  if (!navigation.state.isTransitioning) {
    // transitions must be requested by setting navigation state isTransitioning to true. If false, we set the state immediately
    return {
      transition: null,
      isTransitioning: false,
      navState: navigation.state,
      descriptors: props.descriptors,
    };
  }
  const fromState = state.navState;
  const fromDescriptors = state.descriptors;
  const toState = navigation.state;
  const toDescriptors = props.descriptors;
  const transitionOptions = getTransitionOptions(fromState, toState, {
    ...fromDescriptors,
    ...toDescriptors,
  });
  const createTransition =
    transitionOptions.createTransition || defaultCreateTransition;
  const transitionRouteKey = getTransitionOwnerRouteKey(fromState, toState);
  // if (state.transition && state.transitionRouteKey === transitionRouteKey) {
  //   return {
  //     ...state,
  //     isTransitioning: true,
  //     navState:
  //   }
  // }
  const transition = {
    // allow the screen to define the transition..
    ...createTransition({
      navigation,
      fromState,
      toState,
      toDescriptors,
      fromDescriptors,
      transitionRouteKey,
    }),
    // ..but also ensure these keys are not forgotten or tampered with
    fromState,
    toState,
    toDescriptors,
    fromDescriptors,
    transitionRouteKey,
  };
  return {
    transitionRouteKey,
    isTransitioning: true,
    transition,
    navState: fromState,
    descriptors: fromDescriptors,
  };
};

export class Transitioner extends React.Component {
  state = {
    transition: null,
    transitionRouteKey: null,
    navState: this.props.navigation.state,
    descriptors: this.props.descriptors,
  };

  // never re-assign this!
  _transitionRefs = {};

  static getDerivedStateFromProps = (props, lastState) => {
    if (props.navigation.state === lastState.navState) {
      // no transition needed
      return lastState;
    }
    return getStateForNavChange(props, lastState);
  };

  async _startTransition() {
    // Put state in function scope, so we are confident that we refer to the exact same state later for getStateForNavChange.
    // Even though our state shouldn't change during the animation.
    const { state } = this;
    const { navState, descriptors, transition } = state;
    const { toDescriptors, toState } = transition;
    const transitionOptions = getTransitionOptions(navState, toState, {
      ...descriptors,
      ...toDescriptors,
    });
    const { runTransition } = transitionOptions;
    const run = runTransition || defaultRunTransition;

    // Run animation, this might take some time..
    await run(transition, this._transitionRefs);

    // after async animator, this.props may have changed. re-check it now:
    if (toState === this.props.navigation.state) {
      // Navigation state is currently the exact state we were transitioning to. Set final state and we're done
      this.setState({
        isTransitioning: false,
        navState: toState,
        descriptors: toDescriptors,
      });
      // Also de-reference old screenRefs by replacing this._transitionRefs
      const toKeySet = new Set(toState.routes.map(r => r.key));
      navState.routes.forEach(r => {
        if (!toKeySet.has(r.key)) {
          delete this._transitionRefs[r.key];
        }
      });
    } else {
      // Navigation state prop has changed during the transtion! Schedule another transition
      this.setState(getStateForNavChange(this.props, state));
    }
  }

  componentDidUpdate(lastProps, lastState) {
    if (
      // If we are transitioning
      this.state.transition &&
      // And this is a new transition,
      lastState.transition !== this.state.transition
    ) {
      this._startTransition().then(() => {}, console.error);
    }
  }

  _transitionContext = {
    getTransition: () => this.state.transition,
  };

  render() {
    const { transition, navState, isTransitioning } = this.state;
    const baseRouteKeys = navState.routes.map(r => r.key);
    let routeKeys = baseRouteKeys;
    let toDescriptors = {};

    if (transition) {
      if (transition.toDescriptors) {
        toDescriptors = transition.toDescriptors;
      }
      if (transition.toState) {
        const toRouteKeys = transition.toState.routes.map(r => r.key);
        // While transitioning, our main nav state is transition.toState. But we also need to render screens from the last state, preserving the order
        routeKeys = interleaveArrays(toRouteKeys, baseRouteKeys);
      }
    }

    return (
      <TransitionContext.Provider value={this._transitionContext}>
        {routeKeys.map((key, index) => {
          const ref =
            this._transitionRefs[key] ||
            (this._transitionRefs[key] = React.createRef());
          const descriptor = toDescriptors[key] || this.state.descriptors[key];
          const C = descriptor.getComponent();
          const backScreenRouteKeys = routeKeys.slice(index + 1);
          const backScreenStyles = backScreenRouteKeys.map(
            backScreenRouteKey => {
              const backScreenDescriptor =
                toDescriptors[backScreenRouteKey] ||
                this.state.descriptors[backScreenRouteKey];
              const { options } = backScreenDescriptor;
              if (!transition || !options.getBehindTransitionAnimatedStyle) {
                return {};
              }
              return options.getBehindTransitionAnimatedStyle(transition);
            },
          );
          let thisScreenTransition = transition;
          let transitionFromState = null;
          return (
            <Animated.View
              style={[{ ...StyleSheet.absoluteFillObject }, backScreenStyles]}
              pointerEvents={isTransitioning ? "none" : "auto"}
              key={key}
            >
              <NavigationProvider value={descriptor.navigation}>
                <C
                  transition={thisScreenTransition}
                  transitionFromState={transitionFromState}
                  navigation={descriptor.navigation}
                  transitionRef={ref}
                />
              </NavigationProvider>
            </Animated.View>
          );
        })}
      </TransitionContext.Provider>
    );
  }
}

const createTransitionNavigator = (routeConfig, opts) => {
  const router = StackRouter(routeConfig, opts);
  const Nav = createNavigator(Transitioner, router);
  return Nav;
};

export default createTransitionNavigator;
