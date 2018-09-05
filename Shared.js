import React from "react";
import ReactNative, { StyleSheet, TextInput } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { TransitionContext } from "./Transitioner";
import { Consumer } from "./LayoutContext";

const { add, cond, and, multiply, sub, divide, interpolate, timing } = Animated;

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
      h: new Animated.Value(0)
    });
  return layout;
};
const getTopLayout = (transition, id) => {
  return getLayout(transition.topLayouts, id);
};
const getBottomLayout = (transition, id) => {
  return getLayout(transition.bottomLayouts, id);
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
    bottomLayouts: {},
    topLayouts: {},
    topScreenLayout: {},
    bottomScreenLayout: {}
  };
};

const runSharedTransition = async (transition, transitionScreenRefs) => {
  // By now, everything is already rendered. This is our opportunity to measure shared
  // elements and set those measurements into Animated values so that the pre-rendered
  // transition looks correct
  const topScreenIndex = Math.max(
    transition.toState.index,
    transition.fromState.index
  );
  const topRoute =
    transition.toState.routes[topScreenIndex] ||
    transition.fromState.routes[topScreenIndex];
  const bottomRoute =
    transition.toState.routes[topScreenIndex - 1] ||
    transition.fromState.routes[topScreenIndex - 1];

  const bottomScreen = transitionScreenRefs[bottomRoute.key].current;
  const topScreen = transitionScreenRefs[topRoute.key].current;
  const bottomSharedElements =
    (bottomScreen && bottomScreen.sharedElements) || {};
  const topSharedElements = (topScreen && topScreen.sharedElements) || {};
  const sharedElementIds = Object.keys(bottomSharedElements).filter(
    i => Object.keys(topSharedElements).indexOf(i) !== -1
  );
  const bottomLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = bottomSharedElements[id];
      return await measureEl(element);
    })
  ); // todo, collapse these into one parallel promise.all:
  const topLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = topSharedElements[id];
      return await measureEl(element);
    })
  );
  const topScreenLayout = await measureEl(topScreen.getEl());
  const bottomScreenLayout = await measureEl(bottomScreen.getEl());

  setLayoutOnKey(transition, "topScreenLayout", topScreenLayout);
  setLayoutOnKey(transition, "bottomScreenLayout", bottomScreenLayout);

  sharedElementIds.forEach((sharedElId, index) => {
    setLayoutOnKey(transition.topLayouts, sharedElId, topLayouts[index]);
    setLayoutOnKey(transition.bottomLayouts, sharedElId, bottomLayouts[index]);
  });
  await new Promise(resolve => {
    timing(transition.progress, {
      easing: Easing.out(Easing.cubic),
      duration: 600,
      toValue: 1,
      useNativeDriver: true
    }).start(resolve);
  });
};

const SharedScreenContext = React.createContext(null);

export class SharedTranslateTransition extends React.Component {
  static navigationOptions = {
    createTransition: createSharedTransition((transition, navigation) => {
      const myKey = navigation.state.key;
      let opacity = 1;
      let transform = [];
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
              outputRange: [fromOpacity, toOpacity]
            }),
            transform: [
              {
                translateY: interpolate(transition.progress, {
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ]
          };
        }
      }

      return {};
    }),
    runTransition: runSharedTransition
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
    getNavigation: () => this.props.navigation
  };
  render() {
    const { transition, navigation, children } = this.props;

    let transitionStyles = {};
    if (transition) {
      const toScreenKey =
        transition.toState.routes[transition.toState.index].key;
      const fromScreenKey =
        transition.fromState.routes[transition.fromState.index].key;
      const isFromScreen = fromScreenKey === navigation.state.key;
      const isToScreen = toScreenKey === navigation.state.key;

      //   transitionStyles = {
      //     transform: [
      //       {
      //         translateY: isToScreen
      //           ? interpolate(transition.progress, {
      //               inputRange: [0, 1],
      //               outputRange: [0, 0]
      //             })
      //           : isFromScreen
      //             ? interpolate(transition.progress, {
      //                 inputRange: [0, 1],
      //                 outputRange: [0, 300]
      //               })
      //             : 0
      //       }
      //     ],
      //     opacity: isToScreen
      //       ? transition.progress
      //       : isFromScreen
      //         ? sub(1, transition.progress)
      //         : 1
      //   };
      transitionStyles = transition.getScreenStyle(transition, navigation);
    }
    return (
      <SharedScreenContext.Provider value={this._sharedScreenContext}>
        <Animated.View
          ref={this._screenEl}
          style={{
            flex: 1,
            ...this.props.style,
            ...transitionStyles
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
    runTransition: runSharedTransition
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
    getNavigation: () => this.props.navigation
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
        console.log({ myKey, fromOpacity, toOpacity, toKey });
        opacity = interpolate(transition.progress, {
          inputRange: [0, 1],
          outputRange: [fromOpacity, toOpacity]
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
            ...this.props.style
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
  const topLayout = getTopLayout(transition, id);
  const bottomLayout = getBottomLayout(transition, id);

  if (!topLayout || !bottomLayout) {
    return [{ transform: [] }];
  }
  const toScreenKey = transition.toState.routes[transition.toState.index].key;
  const toIndex = transition.toState.index;
  const fromIndex = transition.fromState.index;
  const isForward = toIndex >= fromIndex;
  const isToScreen = toScreenKey === thisScreenKey;
  const isTop = isToScreen ? isForward : !isForward;

  const inputRange = [0, Number.EPSILON, 1];
  const setBottomRange = (base, dest) =>
    isForward ? [base, base, dest] : [base, dest, base];
  const setTopRange = (base, dest) =>
    isForward ? [base, dest, base] : [base, base, dest];

  const bottomScale = (top, bottom) =>
    interpolate(transition.progress, {
      inputRange,
      outputRange: setBottomRange(1, divide(top, bottom))
    });
  const bottomTranslate = (top, bottom, topSize, bottomSize) =>
    interpolate(transition.progress, {
      inputRange,
      outputRange: setBottomRange(
        0,
        sub(add(top, divide(topSize, 2)), add(bottom, divide(bottomSize, 2)))
      )
    });
  const topScale = (top, bottom) =>
    interpolate(transition.progress, {
      inputRange,
      outputRange: setTopRange(1, divide(bottom, top), 1)
    });
  const topTranslate = (top, bottom, topSize, bottomSize) =>
    interpolate(transition.progress, {
      inputRange,
      outputRange: setTopRange(
        0,
        sub(add(bottom, divide(bottomSize, 2)), add(top, divide(topSize, 2)))
      )
    });

  const isMeasured = and(topLayout.hasMeasured, bottomLayout.hasMeasured);

  const onceMeasuredScale = val => cond(isMeasured, val, 1);
  const onceMeasuredTranslate = val => cond(isMeasured, val, 0);
  const scaleTransform = (top, bottom) =>
    onceMeasuredScale(isTop ? topScale(top, bottom) : bottomScale(top, bottom));
  const translateTransform = (top, bottom, topSize, bottomSize) =>
    onceMeasuredTranslate(
      isTop
        ? topTranslate(top, bottom, topSize, bottomSize)
        : bottomTranslate(top, bottom, topSize, bottomSize)
    );

  return {
    transform: [
      {
        translateX: translateTransform(
          topLayout.x,
          bottomLayout.x,
          topLayout.w,
          bottomLayout.w
        )
      },
      {
        translateY: translateTransform(
          topLayout.y,
          bottomLayout.y,
          topLayout.h,
          bottomLayout.h
        )
      },
      {
        scaleX: scaleTransform(topLayout.w, bottomLayout.w)
      },
      {
        scaleY: scaleTransform(topLayout.h, bottomLayout.h)
      }
    ]
  };
};

class SharedViewWithContext extends React.Component {
  render() {
    const {
      sharedScreenContext,
      transitionContext,
      id,
      style,
      children
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
          getTransitionElementStyle(transition, thisScreenKey, sharedElId)
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
      color
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
          { alignSelf: "center" }
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
