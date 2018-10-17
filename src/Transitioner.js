import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationProvider } from '@react-navigation/core';

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
  return { ...transition };
};

const defaultRunTransition = () => {};

const defaultRenderScreen = (
  ScreenComponent, transition, transitions, transitioningFromState,
  transitioningToState, transitionRouteKey, navigation, ref, behindScreenStyles,
) => (
  <Animated.View
    style={[{ ...StyleSheet.absoluteFillObject }, behindScreenStyles]}
    pointerEvents={'auto'}    
  >
    <ScreenComponent
      transition={transition}
      transitions={transitions}
      transitioningFromState={transitioningFromState}
      transitioningToState={transitioningToState}
      transitionRouteKey={transitionRouteKey}
      navigation={navigation}
      transitionRef={ref}
    />
  </Animated.View>
);

const defaultRenderContainer = (transitionRouteKey, transitions, navigation,
  transitioningFromState, transitioningToState, transitionRefs, children) => (
  <React.Fragment>{children}</React.Fragment>
);

const getStateForNavChange = (props, state) => {
  // by this point we know the nav state has changed and it is safe to provide a new state. static
  // getDerivedStateFromProps will never interrupt a transition (when there is state.transitionRouteKey),
  // and _runTransition runs this after the previous transition is complete.
  const { navigation } = props;
  const nextNavState = navigation.state;

  // Transitions are requested by setting nav state.isTransitioning to true.
  // If false, we set the state immediately without transition
  if (!nextNavState.isTransitioning) {
    return {
      transitions: state.transitions,
      transitionRouteKey: null,
      transitioningFromState: null,
      transitioningFromDescriptors: null,
      navState: nextNavState,
      descriptors: props.descriptors,
    };
  }
  const transitionRouteKey = getTransitionOwnerRouteKey(
    state.navState,
    nextNavState
  );
  const descriptor =
    props.descriptors[transitionRouteKey] ||
    state.descriptors[transitionRouteKey] ||
    state.transitioningFromDescriptors[transitionRouteKey];
  const { options } = descriptor;
  const fromRoute = state.navState.routes[state.navState.index];
  const createTransition = options.createTransition || defaultCreateTransition;
  const transition =
    state.transitions[transitionRouteKey] ||
    createTransition({
      navigation: props.navigation,
      transitionRouteKey,
      fromRouteKey: fromRoute.key,
    });
  return {
    transitions: {
      ...state.transitions,
      [transitionRouteKey]: transition,
    },
    transitionRouteKey,
    transitioningFromState: state.navState,
    transitioningFromDescriptors: state.descriptors,
    navState: nextNavState,
    descriptors: props.descriptors,
  };
};

export class Transitioner extends React.Component {
  state = {
    // an object of transitions by route key
    transitions: {},
    // if this is present, there is a transition in progress:
    transitionRouteKey: null,
    // this will be the previous nav state and descriptors, when there is a transition in progress
    transitioningFromState: null,
    transitioningFromDescriptors: {},
    // this is the current navigation state and descriptors:
    navState: this.props.navigation.state,
    descriptors: this.props.descriptors,
  };

  // never re-assign this!
  _transitionRefs = {};

  static getDerivedStateFromProps = (props, state) => {
    // Transition only happens when nav state changes
    if (props.navigation.state === state.navState) {
      return state;
    }
    // Never interrupt a transition in progress.
    if (state.transitionRouteKey) {
      return state;
    }
    return getStateForNavChange(props, state);
  };

  async _startTransition() {
    // Put state in function scope, so we are confident that we refer to the exact same state later for getStateForNavChange.
    // Even though our state shouldn't change during the animation.
    const { state } = this;
    const {
      transitions,
      transitionRouteKey,
      transitioningFromState,
      transitioningFromDescriptors,
      navState,
      descriptors,
    } = state;

    const descriptor =
      descriptors[transitionRouteKey] ||
      transitioningFromDescriptors[transitionRouteKey];
    const { runTransition } = descriptor.options;
    const run = runTransition || defaultRunTransition;

    const transition = transitions[transitionRouteKey];
    // Run animation, this might take some time..
    await run(
      transition,
      this._transitionRefs,
      transitioningFromState,
      navState
    );

    // after async animator, this.props may have changed. re-check it now:
    if (navState === this.props.navigation.state) {
      // Navigation state is currently the exact state we were transitioning to. Set final state and we're done
      const transitions = {}; // clear out unusued transitions
      navState.routes.map(r => r.key).forEach(activeRouteKey => {
        transitions[activeRouteKey] = state.transitions[activeRouteKey];
      });
      this.setState({
        transitions,
        transitionRouteKey: null,
        transitioningFromState: null,
        transitioningFromDescriptors: {},
        // navState and descriptors remain unchanged at this point.
      });
      // Also de-reference old screenRefs by replacing this._transitionRefs
      const toKeySet = new Set(navState.routes.map(r => r.key));
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
      this.state.transitionRouteKey &&
      // And this is a new transition,
      lastState.transitioningFromState !== this.state.transitioningFromState
    ) {
      this._startTransition().then(
        () => {},
        e => {
          console.error('Error running transition:', e);
        }
      );
    }
  }

  _transitionContext = {
    getTransition: transitionRouteKey => {
      const { navState, transitionFromState, transitions } = this.state;
      const defaultTransitionKey = getTransitionOwnerRouteKey(
        navState,
        transitionFromState
      );
      const key = transitionRouteKey || defaultTransitionKey;
      return transitions[key];
    },
  };

  render() {
    const {
      transitions,
      transitionRouteKey,
      transitioningFromState,
      transitioningFromDescriptors,
      navState,
      descriptors,
    } = this.state;
    const { navigation } = this.props;
    const mainRouteKeys = navState.routes.map(r => r.key);
    let routeKeys = mainRouteKeys;

    if (transitionRouteKey) {
      if (transitioningFromState) {
        const prevRouteKeys = transitioningFromState.routes.map(r => r.key);
        // While transitioning, our main nav state is navState. But we also need to render screens from the last state, preserving the order
        routeKeys = interleaveArrays(prevRouteKeys, mainRouteKeys);
      }
    }

    // Use render container function from last route descriptor
    const renderContainerFunc = descriptors[transitionRouteKey].options.renderContainer
      || defaultRenderContainer;

    return (
      <TransitionContext.Provider value={this._transitionContext}>
        {renderContainerFunc(transitionRouteKey, transitions, navigation,
          transitioningFromState, transitionRouteKey ? navigation.state : null,
          routeKeys.map((key, index) => {
          const ref =
            this._transitionRefs[key] ||
            (this._transitionRefs[key] = React.createRef());
          const descriptor =
            descriptors[key] || transitioningFromDescriptors[key];
          const C = descriptor.getComponent();

          const aboveScreenRouteKeys = routeKeys.slice(index + 1);
          let behindScreenStyles = aboveScreenRouteKeys.map(
            aboveScreenRouteKey => {
              const aboveTransition = transitions[aboveScreenRouteKey];
              const aboveScreenDescriptor =
                descriptors[aboveScreenRouteKey] ||
                transitioningFromDescriptors[aboveScreenRouteKey];
              const { options } = aboveScreenDescriptor;
              if (
                !aboveTransition ||
                !options.getBehindTransitionAnimatedStyle
              ) {
                return {};
              }
              return options.getBehindTransitionAnimatedStyle(aboveTransition);
            }
          );

          let transition = transitions[key];
          if (behindScreenStyles.length === 0) {
            // bizarre react-native bug that refuses to clear Animated.View styles unless you do something like this..
            // to reproduce the problem, set a getBehindTransitionAnimatedStyle that puts opacity at 0.5
            behindScreenStyles = [{ opacity: 1 }];
          }

          const renderFunc = descriptor.options.renderScreen || defaultRenderScreen;
          
          return (
            <NavigationProvider key={key} value={descriptor.navigation}>              
              {renderFunc(C, transition, transitions, transitioningFromState,
                transitionRouteKey ? navigation.state : null,
                transitionRouteKey, descriptor.navigation, ref, 
                behindScreenStyles, key)}
            </NavigationProvider>            
          );
        }))}
      </TransitionContext.Provider>
    );
  }
}

export default Transitioner;
