import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { TransitionContext } from './Transitioner';

const { add, cond, and, sub, divide, interpolate, timing } = Animated;

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
  setAnimatedValueOnKey(layoutObj, 'w', layout.w);
  setAnimatedValueOnKey(layoutObj, 'h', layout.h);
  setAnimatedValueOnKey(layoutObj, 'x', layout.x);
  setAnimatedValueOnKey(layoutObj, 'y', layout.y);
  setAnimatedValueOnKey(layoutObj, 'hasMeasured', 1);
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

const createSharedTransition = transition => {
  const progress = new Animated.Value(0);

  return {
    ...transition,
    progress,
    fromLayouts: {},
    transitionLayouts: {},
    transitionScreenLayout: {},
    fromScreenLayout: {},
  };
};

const runSharedTransition = async (
  transition,
  transitionScreenRefs,
  fromState,
  toState
) => {
  // By now, everything is already rendered. This is our opportunity to measure shared
  // elements and set those measurements into Animated values so that the pre-rendered
  // transition looks correct

  const transitionRouteKey = transition.transitionRouteKey;
  const fromRouteKey = transition.fromRouteKey;
  const fromScreen = transitionScreenRefs[fromRouteKey].current;
  const transitionScreen = transitionScreenRefs[transitionRouteKey].current;
  const fromSharedElements = (fromScreen && fromScreen.sharedElements) || {};
  const toSharedElements =
    (transitionScreen && transitionScreen.sharedElements) || {};
  const sharedElementIds = Object.keys(fromSharedElements).filter(
    i => Object.keys(toSharedElements).indexOf(i) !== -1
  );
  const fromLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = fromSharedElements[id];
      return await measureEl(element);
    })
  ); // todo, collapse these into one parallel promise.all:
  const transitionLayouts = await Promise.all(
    sharedElementIds.map(async id => {
      const element = toSharedElements[id];
      return await measureEl(element);
    })
  );
  const transitionScreenLayout = await measureEl(transitionScreen.getEl());
  const fromScreenLayout = await measureEl(fromScreen.getEl());

  setLayoutOnKey(transition, 'transitionScreenLayout', transitionScreenLayout);
  setLayoutOnKey(transition, 'fromScreenLayout', fromScreenLayout);

  sharedElementIds.forEach((sharedElId, index) => {
    setLayoutOnKey(
      transition.transitionLayouts,
      sharedElId,
      transitionLayouts[index]
    );
    setLayoutOnKey(transition.fromLayouts, sharedElId, fromLayouts[index]);
  });
  const destValue = toState.routes.find(
    r => r.key === transition.transitionRouteKey
  )
    ? 1
    : 0;
  await new Promise(resolve => {
    timing(transition.progress, {
      easing: Easing.out(Easing.cubic),
      duration: 600,
      toValue: destValue,
      useNativeDriver: true,
    }).start(resolve);
  });
};

const SharedScreenContext = React.createContext(null);

export class SharedFadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: createSharedTransition,
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
    getTransitioningFromState: () => this.props.transitioningFromState,
    getTransitioningToState: () => this.props.transitioningToState,
  };
  render() {
    const { transition, children } = this.props;
    let opacity = 1;
    if (transition) {
      const { progress } = transition;
      opacity = interpolate(progress, {
        inputRange: [0, 1],
        outputRange: [0, 1],
      });
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

const getTransitionElementStyle = (transitionContext, screenContext, id) => {
  const transition = transitionContext.getTransition();
  const thisScreenKey = screenContext.getNavigation().state.key;
  if (!transition) {
    return [{ transform: [] }];
  }
  const transitionLayout = getLayout(transition.transitionLayouts, id);
  const fromLayout = getLayout(transition.fromLayouts, id);

  if (!transitionLayout || !fromLayout) {
    throw new Error('This is unexpected');
  }
  const transitionRouteKey = transition.transitionRouteKey;
  const fromRouteKey = transition.fromRouteKey;
  const isTransitionScreen = transitionRouteKey === thisScreenKey;
  const isFromScreen = fromRouteKey === thisScreenKey;

  const isMeasured = and(transitionLayout.hasMeasured, fromLayout.hasMeasured);

  const doInterpolate = (measureVal, start, end) =>
    interpolate(transition.progress, {
      inputRange: [0, Number.EPSILON, 1],
      outputRange: [measureVal, start, end],
    });

  const interpolateScale = (to, from) => {
    if (isTransitionScreen) {
      return doInterpolate(1, divide(from, to), 1);
    } else if (isFromScreen) {
      return doInterpolate(1, 1, divide(to, from));
    } else {
      return doInterpolate(1, 1, 1);
    }
  };
  const interpolateTranslate = (toOffset, fromOffset, toScale, fromScale) => {
    if (isTransitionScreen) {
      return doInterpolate(
        0,
        sub(
          add(fromOffset, divide(fromScale, 2)),
          add(toOffset, divide(toScale, 2))
        ),
        0
      );
    } else if (isFromScreen) {
      return doInterpolate(
        0,
        0,
        sub(
          add(toOffset, divide(toScale, 2)),
          add(fromOffset, divide(fromScale, 2))
        )
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
      0
    );

  return {
    transform: [
      {
        translateX: translateTransform(
          transitionLayout.x,
          fromLayout.x,
          transitionLayout.w,
          fromLayout.w
        ),
      },
      {
        translateY: translateTransform(
          transitionLayout.y,
          fromLayout.y,
          transitionLayout.h,
          fromLayout.h
        ),
      },
      {
        scaleX: scaleTransform(transitionLayout.w, fromLayout.w),
      },
      {
        scaleY: scaleTransform(transitionLayout.h, fromLayout.h),
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
      throw new Error('Cannot render shared element outside of shared screen!');
    }
    const { setSharedElement } = sharedScreenContext;

    if (!transitionContext) {
      throw new Error('Cannot render shared element outside of transitioner!');
    }

    return (
      <Animated.View
        style={[
          style,
          getTransitionElementStyle(
            transitionContext,
            sharedScreenContext,
            sharedElId
          ),
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
      throw new Error('Cannot render shared element outside of shared screen!');
    }
    const { setSharedElement } = sharedScreenContext;

    if (!transitionContext) {
      throw new Error('Cannot render shared element outside of transitioner!');
    }

    return (
      <Animated.View
        style={[
          style,
          getTransitionElementStyle(
            transitionContext,
            sharedScreenContext,
            sharedElId
          ),
          { alignSelf: 'center' },
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
