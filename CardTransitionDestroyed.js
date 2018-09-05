import React from "react";
import {
  StyleSheet,
  Text,
  Button,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Image,
  TouchableHighlight,
  SafeAreaView,
  ScrollView
} from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Consumer } from "./LayoutContext";

const {
  multiply,
  add,
  block,
  sub,
  eq,
  neq,
  cond,
  spring,
  timing,
  lessOrEq,
  not,
  call,
  event,
  Value,
  Clock,
  debug,
  defined,
  clockRunning,
  stopClock,
  startClock,
  set,
  lessThan,
  divide,
  greaterThan,
  and,
  interpolate
} = Animated;

const TOSS_SEC = 0.2;

export default class CardTransition extends React.Component {
  static navigationOptions = {
    createTransition: transition => {
      const openProgress = new Value(0);
      // const behindAnimatedStyle = {
      //   opacity: interpolate(openProgress, {
      //     inputRange: [0, 1],
      //     outputRange: [1, 0]
      //   })
      // };
      return {
        //behindAnimatedStyle,
        openProgress
      };
    },
    getBehindTransitionAnimatedStyle: transition => {
      return {
        // opacity: interpolate(transition.openProgress, {
        //   inputRange: [0, 1],
        //   outputRange: [1, 0.5]
        // })
      };
    },
    runTransition: async (transition, screenComponents) => {
      const { fromState, toState, transitionRouteKey } = transition;

      const screen =
        screenComponents[transitionRouteKey] &&
        screenComponents[transitionRouteKey].current;
      if (!screen) {
        throw new Error(
          "Cannot find ref to screen component! Be sure to pass ref={props.transitionRef} to transition component"
        );
      }
      await screen.runTransition(transition);
      // if (screen && screen.isAnimatingClosed && screen.isAnimatingClosed()) {
      // await screen.waitForCloseAnimation();
      //   return;
      // }

      // console.log('')
      // targetProgress.setValue(1);
      // await new Promise(resolve => {
      //   // The .start() callback for `.spring(` doesn't fire, :( ..using timing temporarily instead..
      //   timing(transition.progress, {
      //     toValue: 1,
      //     // Spring Config:
      //     // https://github.com/react-navigation/react-navigation-stack/blob/6b10e8afd681c8aa81d785791f4f41f1d3647b51/src/views/StackView/StackViewTransitionConfigs.js#L12
      //     // stiffness: 1000,
      //     // damping: 500,
      //     // mass: 3,

      //     // Sad timing Config:
      //     easing: Easing.inOut(Easing.cubic),
      //     duration: 250
      //   }).start(resolve);
      // });
    }
  };
  _gestureVelocityX = new Value(0);
  _gestureTranslateX = new Value(0);
  _gestureLastVelocityX = new Value(0);
  _gestureLastTranslateX = new Value(0);
  _gesturePrevTranslateX = new Value(0);

  _gestureState = new Value(State.END);
  _clock = new Clock();

  _isClosing = and(
    neq(this._gestureState, State.ACTIVE),
    greaterThan(
      add(
        this._gestureLastTranslateX,
        multiply(TOSS_SEC, this._gestureLastVelocityX)
      ),
      100
    )
  );
  _springState = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0)
  };
  _destOpenProgress = new Value(1);
  _screenWidth = new Value(0);
  _destTranslateProgress = cond(
    eq(this._destOpenProgress, 1),
    0,
    this._screenWidth
  );
  _springConfig = {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: this._destTranslateProgress
  };
  _translateProgress = new Value(0);
  _timedTranslateProgress = block([
    cond(clockRunning(this._clock), 0, [
      set(this._springState.finished, 0),
      set(this._springState.velocity, this._gestureVelocityX),
      set(this._springState.position, this._screenWidth),
      startClock(this._clock)
    ]),
    spring(this._clock, this._springState, this._springConfig),
    cond(this._springState.finished, stopClock(this._clock)),
    this._springState.position
  ]);
  _cardTranslateX = this._timedTranslateProgress;

  runTransition = async transition => {
    const { navigation } = this.props;
    const { fromState, toState } = transition;
    const toKey = toState.routes[toState.index].key;
    const fromKey = fromState.routes[fromState.index].key;
    const isToOpen = toKey === navigation.state.key;
    const isFromOpen = fromKey === navigation.state.key;
    const destProgress = isToOpen ? 1 : 0;
    const startProgress = isFromOpen ? 1 : 0;
    console.log("ok destProgress", destProgress);
    this._destOpenProgress.setValue(destProgress);
    this._translateProgress.setValue(startProgress);
    await new Promise((resolve, reject) => {
      this._animationRestSubscribers.push(resolve);
      setTimeout(() => reject("Transition callback failure"), 2000);
    });

    debugger;
  };
  isAnimatingClosed = () => {
    return this._isClosingViaGesture;
  };
  _animationRestSubscribers = [];

  _renderWithLayout = layout => {
    this._screenWidth.setValue(layout.width);
    const { transition, navigation } = this.props;
    let defaultTranslateProgress = 0;
    let openProgress = new Value(1);
    // spring logic inspired by https://github.com/kmagiera/react-native-reanimated/blob/master/Example/snappable/index.js#L30
    if (transition) {
      const key = navigation.state.key;
      console.log("hio", transition, layout.width);
      const { progress, toState, fromState } = transition;
      const fromKey = fromState.routes[fromState.index].key;
      const toKey = toState.routes[toState.index].key;
      defaultTranslateProgress = toKey === key ? 0 : layout.width;
    }
    //   openProgress = transition.openProgress;
    // if (fromState.index <= toState.index && toKey === key) {
    //   forwardProgress = transition.progress;
    // } else if (fromState.index > toState.index && fromKey === key) {
    //   forwardProgress = sub(1, transition.progress);
    // }
    // }
    // const gesturePosition = [
    //   cond(
    //     eq(this._gestureState, State.ACTIVE),
    //     [
    //       stopClock(this._clock),
    //       set(
    //         this._offsetX,
    //         add(
    //           this._offsetX,
    //           sub(this._gestureTranslateX, this._gesturePrevTranslateX)
    //         )
    //       ),
    //       set(this._gesturePrevTranslateX, this._gestureTranslateX),
    //       set(this._gestureLastTranslateX, this._gestureTranslateX),
    //       set(this._gestureLastVelocityX, this._gestureVelocityX),
    //       this._offsetX
    //     ],
    //     [
    //       set(this._gesturePrevTranslateX, 0),
    //       set(
    //         this._offsetX,
    //         cond(
    //           defined(this._offsetX),
    //           [
    //             cond(clockRunning(this._clock), 0, [
    //               set(this._springState.finished, 0),
    //               set(this._springState.velocity, this._gestureVelocityX),
    //               set(this._springState.position, this._offsetX),
    //               set(
    //                 this._springConfig.toValue,
    //                 cond(this._isClosing, layout.width, 0)
    //               ),
    //               startClock(this._clock)
    //             ]),
    //             spring(this._clock, this._springState, this._springConfig),
    //             cond(this._springState.finished, stopClock(this._clock)),
    //             call(
    //               [and(this._springState.finished, this._isClosing)],
    //               states => {
    //                 const [isComplete] = states;
    //                 if (isComplete) {
    //                   this._animationRestSubscribers.forEach(closeSubscriber =>
    //                     closeSubscriber()
    //                   );
    //                   this._animationRestSubscribers = [];
    //                   this._springState = {
    //                     finished: new Value(0),
    //                     velocity: new Value(0),
    //                     position: new Value(0),
    //                     time: new Value(0)
    //                   };
    //                 }
    //               }
    //             ),
    //             this._springState.position
    //           ],
    //           0
    //         )
    //       )
    //     ]
    //   )
    // ];
    // let cardTranslateX = gesturePosition;

    // if (
    //   transition &&
    //   transition.transitionRouteKey === this.props.navigation.state.key &&
    //   !this._isClosingViaGesture
    // ) {
    //   const { progress, fromState, toState } = transition;
    //   const isForward = toState.index >= fromState.index;

    //   const transitionTranslate = multiply(
    //     isForward ? sub(1, progress) : progress,
    //     layout.width
    //   );
    //   cardTranslateX = add(gesturePosition, transitionTranslate);
    // }

    return (
      <React.Fragment>
        <PanGestureHandler
          minOffsetX={10}
          hitSlop={{ right: 0, width: 100 }}
          onHandlerStateChange={event([
            {
              nativeEvent: {
                state: this._gestureState
              }
            }
          ])}
          onGestureEvent={event([
            {
              nativeEvent: {
                translationX: this._gestureTranslateX,
                velocityX: this._gestureVelocityX
              }
            }
          ])}
        >
          <Animated.View
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 5,
              // shadowOpacity: interpolate(openProgress, {
              //   inputRange: [0, 1],
              //   outputRange: [0.2, 0],
              //   extrapolate: "clamp"
              // }),
              backgroundColor: "#E9E9EF",
              flex: 1,
              opacity: 1,
              transform: [
                {
                  translateX: transition ? this._cardTranslateX : 0
                }
              ]
            }}
          >
            {this.props.children}
          </Animated.View>
        </PanGestureHandler>
        <Animated.Code
          exec={call([this._isClosing], values => {
            const [isClosing] = values;
            const wasClosing = this._isClosingViaGesture;

            if (isClosing && !wasClosing) {
              this._isClosingViaGesture = true;
              this.props.navigation.goBack();
            }
          })}
        />
      </React.Fragment>
    );
  };
  render() {
    return <Consumer>{this._renderWithLayout}</Consumer>;
  }
}
