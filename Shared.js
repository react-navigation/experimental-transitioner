import React from "react";
import Animated, { Easing } from "react-native-reanimated";
import { TransitionContext } from "./Transitioner";

const { add, cond, and, sub, divide, interpolate, timing, call } = Animated;

const measureEl = async sharedElement => {
  const layout = await new Promise((resolve, reject) => {
    const sharedNode = sharedElement.getNode();
    sharedNode.measureInWindow((x, y, w, h) => {
      resolve({ x: x, y: y, w, h });
    }, reject);
  });
  return layout;
};

const setAnimatedValueOnKey = (obj, key, value) => {
  const val = obj[key] || (obj[key] = new Animated.Value(value));
  val.setValue(value);
};

const setLayoutOnKey = (obj, key, layout) => {
  const layoutObj = obj[key] || (obj[key] = {});
  setAnimatedValueOnKey(layoutObj, "w", layout.w);
  setAnimatedValueOnKey(layoutObj, "h", layout.h);
  setAnimatedValueOnKey(layoutObj, "x", layout.x);
  setAnimatedValueOnKey(layoutObj, "y", layout.y);
  setAnimatedValueOnKey(layoutObj, "hasMeasured", 1);
};

const getLayout = (layoutsObj, id) => {
  if (!layoutsObj) {
    return null;
  }
  const layout =
    layoutsObj[id] ||
    (layoutsObj[id] = {
      hasMeasured: new Animated.Value(0),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      w: new Animated.Value(0),
      h: new Animated.Value(0),
    });
  return layout;
};

const createSharedTransition = getScreenStyle => transition => {
  let key = transition.fromState.routes[transition.fromState.index].key;
  if (
    transition.toState &&
    transition.toState.index >= transition.fromState.index
  ) {
    key = transition.toState.routes[transition.toState.index].key;
  }
  const progress = new Animated.Value(0);

  return {
    ...transition,
    getScreenStyle,
    progress,
    key,
    fromLayouts: {},
    toLayouts: {},
    toScreenLayout: {},
    fromScreenLayout: {},
  };
};

const runSharedTransition = async (transition, transitionScreenRefs) => {
  // By now, everything is already rendered. This is our opportunity to measure shared
  // elements and set those measurements into Animated values so that the pre-rendered
  // transition looks correct

  const { toState, fromState } = transition;
  const toRouteKey = toState.routes[toState.index].key;
  const fromRouteKey = fromState.routes[fromState.index].key;
  const fromScreen = transitionScreenRefs[fromRouteKey].current;
  const toScreen = transitionScreenRefs[toRouteKey].current;
  const fromSharedElements = (fromScreen && fromScreen.sharedElements) || {};
  const toSharedElements = (toScreen && toScreen.sharedElements) || {};
  const sharedElementIds = Object.keys(fromSharedElements).filter(
    i => Object.keys(toSharedElements).indexOf(i) !== -1,
  );
  const fromLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = fromSharedElements[id];
      return await measureEl(element);
    }),
  ); // todo, collapse these into one parallel promise.all:
  const toLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = toSharedElements[id];
      return await measureEl(element);
    }),
  );
  const toScreenLayout = await measureEl(toScreen.getEl());
  const fromScreenLayout = await measureEl(fromScreen.getEl());

  setLayoutOnKey(transition, "toScreenLayout", toScreenLayout);
  setLayoutOnKey(transition, "fromScreenLayout", fromScreenLayout);

  sharedElementIds.forEach((sharedElId, index) => {
    setLayoutOnKey(transition.toLayouts, sharedElId, toLayouts[index]);
    setLayoutOnKey(transition.fromLayouts, sharedElId, fromLayouts[index]);
  });
  await new Promise(resolve => {
    timing(transition.progress, {
      easing: Easing.out(Easing.cubic),
      duration: 600,
      toValue: 1,
      useNativeDriver: true,
    }).start(resolve);
  });
};

const SharedScreenContext = React.createContext(null);

export class SharedTranslateTransition extends React.Component {
  static navigationOptions = {
    createTransition: createSharedTransition((transition, navigation) => {
      const myKey = navigation.state.key;
      if (transition) {
        const { fromState, toState, key } = transition;
        if (key === myKey) {
          const fromKey = fromState.routes[fromState.index].key;
          const toKey = toState.routes[toState.index].key;
          const toOpacity = myKey === toKey ? 1 : 0;
          const fromOpacity = myKey === fromKey ? 1 : 0;
          return {
            opacity: interpolate(transition.progress, {
              inputRange: [0, 1],
              outputRange: [fromOpacity, toOpacity],
            }),
            transform: [
              {
                translateY: interpolate(transition.progress, {
                  inputRange: [0, 1],
                  outputRange: [0, 0],
                }),
              },
            ],
          };
        }
      }

      return {};
    }),
    runTransition: runSharedTransition,
  };

  sharedElements = {};

  _screenEl = React.createRef();

  getEl = () => {
    return this._screenEl.current;
  };

  _setSharedElement = (id, ref) => {
    this.sharedElements[id] = ref;
  };
  _sharedScreenContext = {
    setSharedElement: this._setSharedElement,
    getNavigation: () => this.props.navigation,
  };
  render() {
    const { transition, navigation, children } = this.props;

    let transitionStyles = {};
    if (transition) {
      transitionStyles = transition.getScreenStyle(transition, navigation);
    }
    return (
      <SharedScreenContext.Provider value={this._sharedScreenContext}>
        <Animated.View
          ref={this._screenEl}
          style={{
            flex: 1,
            ...this.props.style,
            ...transitionStyles,
          }}
        >
          {children}
        </Animated.View>
      </SharedScreenContext.Provider>
    );
  }
}

export class SharedFadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: createSharedTransition(),
    runTransition: runSharedTransition,
  };

  sharedElements = {};
  _screenEl = React.createRef();

  getEl = () => {
    return this._screenEl.current;
  };

  _setSharedElement = (id, ref) => {
    this.sharedElements[id] = ref;
  };
  _sharedScreenContext = {
    setSharedElement: this._setSharedElement,
    getNavigation: () => this.props.navigation,
  };
  render() {
    const { transition, navigation, children } = this.props;
    const myKey = navigation.state.key;
    let opacity = 1;
    if (transition) {
      const { fromState, toState, key } = transition;
      if (key === myKey) {
        const fromKey = fromState.routes[fromState.index].key;
        const toKey = toState.routes[toState.index].key;
        const fromOpacity = myKey === fromKey ? 1 : 0;
        const toOpacity = myKey === toKey ? 1 : 0;
        opacity = interpolate(transition.progress, {
          inputRange: [0, 1],
          outputRange: [fromOpacity, toOpacity],
        });
      }
    }
    return (
      <SharedScreenContext.Provider value={this._sharedScreenContext}>
        <Animated.View
          ref={this._screenEl}
          style={{
            flex: 1,
            opacity,
            ...this.props.style,
          }}
        >
          {children}
        </Animated.View>
      </SharedScreenContext.Provider>
    );
  }
}

const getTransitionElementStyle = (transition, thisScreenKey, id) => {
  if (!transition) {
    return [{ transform: [] }];
  }
  const toLayout = getLayout(transition.toLayouts, id);
  const fromLayout = getLayout(transition.fromLayouts, id);

  if (!toLayout || !fromLayout) {
    return [{ transform: [] }];
  }
  const toRouteKey = transition.toState.routes[transition.toState.index].key;
  const fromRouteKey =
    transition.fromState.routes[transition.fromState.index].key;
  const isToScreen = toRouteKey === thisScreenKey;
  const isFromScreen = fromRouteKey === thisScreenKey;

  const isMeasured = and(toLayout.hasMeasured, fromLayout.hasMeasured);

  const doInterpolate = (measureVal, start, end) =>
    interpolate(transition.progress, {
      inputRange: [0, Number.EPSILON, 1],
      outputRange: [measureVal, start, end],
    });

  const interpolateScale = (to, from) => {
    if (isToScreen) {
      return doInterpolate(1, divide(from, to), 1);
    } else if (isFromScreen) {
      return doInterpolate(1, 1, divide(to, from));
    } else {
      return doInterpolate(1, 1, 1);
    }
  };
  const interpolateTranslate = (toOffset, fromOffset, toScale, fromScale) => {
    if (isToScreen) {
      return doInterpolate(
        0,
        sub(
          add(fromOffset, divide(fromScale, 2)),
          add(toOffset, divide(toScale, 2)),
        ),
        0,
      );
    } else if (isFromScreen) {
      return doInterpolate(
        0,
        0,
        sub(
          add(toOffset, divide(toScale, 2)),
          add(fromOffset, divide(fromScale, 2)),
        ),
      );
    } else {
      return doInterpolate(0, 0, 0);
    }
  };

  const scaleTransform = (to, from) =>
    cond(isMeasured, interpolateScale(to, from), 1);
  const translateTransform = (toOffset, fromOffset, toScale, fromScale) =>
    cond(
      isMeasured,
      interpolateTranslate(toOffset, fromOffset, toScale, fromScale),
      0,
    );

  return {
    transform: [
      {
        translateX: translateTransform(
          toLayout.x,
          fromLayout.x,
          toLayout.w,
          fromLayout.w,
        ),
      },
      {
        translateY: translateTransform(
          toLayout.y,
          fromLayout.y,
          toLayout.h,
          fromLayout.h,
        ),
      },
      {
        scaleX: scaleTransform(toLayout.w, fromLayout.w),
      },
      {
        scaleY: scaleTransform(toLayout.h, fromLayout.h),
      },
    ],
  };
};

class SharedViewWithContext extends React.Component {
  render() {
    const {
      sharedScreenContext,
      transitionContext,
      id,
      style,
      children,
    } = this.props;

    const sharedElId = `${id}_view`;

    if (!sharedScreenContext) {
      throw new Error("Cannot render shared element outside of shared screen!");
    }
    const { setSharedElement, getNavigation } = sharedScreenContext;

    if (!transitionContext) {
      throw new Error("Cannot render shared element outside of transitioner!");
    }

    const transition = transitionContext.getTransition();

    const thisScreenKey = getNavigation().state.key;

    return (
      <Animated.View
        style={[
          style,
          getTransitionElementStyle(transition, thisScreenKey, sharedElId),
        ]}
        ref={r => setSharedElement(sharedElId, r)}
      >
        {children}
      </Animated.View>
    );
  }
}

export const SharedView = props => (
  <TransitionContext.Consumer>
    {transitionContext => (
      <SharedScreenContext.Consumer>
        {sharedScreenContext => (
          <SharedViewWithContext
            {...props}
            transitionContext={transitionContext}
            sharedScreenContext={sharedScreenContext}
          />
        )}
      </SharedScreenContext.Consumer>
    )}
  </TransitionContext.Consumer>
);

class SharedTextWithContext extends React.Component {
  render() {
    const {
      sharedScreenContext,
      transitionContext,
      id,
      style,
      children,
      fontSize,
      color,
    } = this.props;

    const sharedElId = `${id}_text`;

    if (!sharedScreenContext) {
      throw new Error("Cannot render shared element outside of shared screen!");
    }
    const { setSharedElement, getNavigation } = sharedScreenContext;

    if (!transitionContext) {
      throw new Error("Cannot render shared element outside of transitioner!");
    }

    const transition = transitionContext.getTransition();

    const thisScreenKey = getNavigation().state.key;

    return (
      <Animated.View
        style={[
          style,
          getTransitionElementStyle(transition, thisScreenKey, sharedElId),
          { alignSelf: "center" },
        ]}
        ref={r => setSharedElement(sharedElId, r)}
      >
        <Animated.Text style={{ fontSize, color }}>{children}</Animated.Text>
      </Animated.View>
    );
  }
}

export const SharedText = props => (
  <TransitionContext.Consumer>
    {transitionContext => (
      <SharedScreenContext.Consumer>
        {sharedScreenContext => (
          <SharedTextWithContext
            {...props}
            transitionContext={transitionContext}
            sharedScreenContext={sharedScreenContext}
          />
        )}
      </SharedScreenContext.Consumer>
    )}
  </TransitionContext.Consumer>
);
