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
  Dimensions,
  ScrollView,
} from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Consumer } from "./LayoutContext";

const {
  multiply,
  add,
  sub,
  eq,
  neq,
  cond,
  spring,
  timing,
  lessOrEq,
  not,
  block,
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
  interpolate,
} = Animated;
const callWhenTrue = (val, callback) => cond(val, call([val], callback));

const TOSS_VELOCITY_MULTIPLIER = 0.2;

export default class CardTransition extends React.Component {
  static navigationOptions = {
    getBehindTransitionAnimatedStyle: transition => {
      return {
        opacity: interpolate(transition.progress, {
          inputRange: [0, 1],
          outputRange: [1, 0.85],
        }),
        transform: [
          {
            translateX: multiply(
              -0.3,
              multiply(transition.screenWidth, transition.progress),
            ),
          },
        ],
      };
    },
    createTransition: transition => {
      const clock = new Clock();
      const gestureState = new Value(State.END);
      const gestureTranslateX = new Value(0);
      const prevGestureTranslateX = new Value(0);
      const gestureVelocityX = new Value(0);
      const targetProgress = new Value(0);
      const screenWidth = new Value(Dimensions.get("window").width);
      const targetProgressDistance = multiply(targetProgress, screenWidth);
      const progressDistance = new Value(0);
      const isAtRest = and(
        not(clockRunning(clock)),
        neq(gestureState, State.ACTIVE),
      );
      const uprightGestureTranslateX = multiply(gestureTranslateX, -1);
      const uprightGestureVelocityX = multiply(gestureVelocityX, -1);
      const lastGestureTranslateX = new Value(0);
      const lastGestureVelocityX = new Value(0);
      const state = {
        finished: new Value(0),
        velocity: new Value(0),
        position: progressDistance,
        time: new Value(0),
      };

      const config = {
        stiffness: 1000,
        damping: 1000,
        mass: 3,
        overshootClamping: true,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
        toValue: targetProgressDistance,
      };

      const goSpring = [
        cond(clockRunning(clock), 0, [
          set(state.finished, 0),
          set(state.velocity, uprightGestureVelocityX),
          startClock(clock),
        ]),
        spring(clock, state, config),
        cond(state.finished, stopClock(clock)),
      ];

      const springProgressDistance = block([
        cond(
          eq(gestureState, State.ACTIVE),
          [
            stopClock(clock),
            set(
              progressDistance,
              add(
                progressDistance,
                sub(uprightGestureTranslateX, prevGestureTranslateX),
              ),
            ),
            set(prevGestureTranslateX, uprightGestureTranslateX),
            set(lastGestureTranslateX, uprightGestureTranslateX),
            set(lastGestureVelocityX, uprightGestureVelocityX),
          ],
          [set(prevGestureTranslateX, 0), goSpring],
        ),
        progressDistance,
      ]);
      let callbacksWaitingForRest = [];
      const whenDoneCallback = () => {
        callbacksWaitingForRest.forEach(cb => cb());
        callbacksWaitingForRest = [];
      };
      const waitForDone = () =>
        new Promise(resolve => {
          callbacksWaitingForRest.push(resolve);
        });
      const closingCallback = () => {
        // transition.navigation.goBack(transition.transitionRouteKey);
        targetProgress.setValue(0);
      };
      const isClosing = and(
        neq(gestureState, State.ACTIVE),
        lessThan(
          add(
            lastGestureTranslateX,
            multiply(TOSS_VELOCITY_MULTIPLIER, lastGestureVelocityX),
          ),
          -100,
        ),
      );
      const finalDistanceProgress = block([
        springProgressDistance,
        callWhenTrue(isAtRest, whenDoneCallback),
        callWhenTrue(isClosing, closingCallback),
        springProgressDistance,
      ]);
      return {
        ...transition,
        screenWidth,
        gestureState,
        gestureTranslateX,
        gestureVelocityX,
        targetProgress,
        progress: divide(finalDistanceProgress, screenWidth),
        waitForDone,
      };
    },
    runTransition: async transition => {
      transition.targetProgress.setValue(1);

      await transition.waitForDone();
    },
  };
  _renderCard = styles => {
    return (
      <Animated.View
        style={{
          ...styles,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 5,
          backgroundColor: "#E9E9EF",
          flex: 1,
          opacity: 1,
        }}
      >
        {this.props.children}
      </Animated.View>
    );
  };
  render() {
    return <Consumer>{this._renderWithLayout}</Consumer>;
  }
  _renderWithLayout = layout => {
    const { transition, navigation } = this.props;
    const myKey = navigation.state.key;
    if (!transition || transition.transitionRouteKey !== myKey) {
      return this._renderCard({});
    }
    const {
      screenWidth,
      fromState,
      toState,
      progress,
      gestureState,
      gestureTranslateX,
      gestureVelocityX,
    } = transition;
    screenWidth.setValue(layout.width);
    const fromTranslate = fromState.routes.find(r => r.key === myKey)
      ? 0
      : layout.width;
    const toTranslate = toState.routes.find(r => r.key === myKey)
      ? 0
      : layout.width;

    const styles = {
      transform: [
        {
          translateX: interpolate(progress, {
            inputRange: [0, 1],
            outputRange: [fromTranslate, toTranslate],
          }),
        },
      ],
      shadowOpacity: interpolate(progress, {
        inputRange: [0, 1],
        outputRange: [0, 0.2],
        extrapolate: "clamp",
      }),
    };

    return (
      <PanGestureHandler
        minOffsetX={10}
        onHandlerStateChange={event([
          {
            nativeEvent: {
              state: gestureState,
            },
          },
        ])}
        onGestureEvent={event([
          {
            nativeEvent: {
              translationX: gestureTranslateX,
              velocityX: gestureVelocityX,
            },
          },
        ])}
      >
        {this._renderCard(styles)}
      </PanGestureHandler>
    );
  };
}

// export default class CardTransition extends React.Component {
//   static navigationOptions = {
//     createTransition: transition => {
//       const progress = new Value(0);
//       const behindAnimatedStyle = {
//         opacity: interpolate(progress, {
//           inputRange: [0, 1],
//           outputRange: [1, 0]
//         })
//       };
//       return { behindAnimatedStyle, progress };
//     },
//     getBehindTransitionAnimatedStyle: transition => {
//       return {
//         opacity: interpolate(transition.progress, {
//           inputRange: [0, 1],
//           outputRange: [1, 0]
//         })
//       };
//     },
//     runTransition: async (transition, screenComponents) => {
//       const { fromState, toState } = transition;
//       let transitionKey = fromState.routes[fromState.index].key;
//       if (toState && toState.index >= fromState.index) {
//         transitionKey = toState.routes[toState.index].key;
//       }
//       const screen =
//         screenComponents[transitionKey] &&
//         screenComponents[transitionKey].current;
//       if (screen && screen.isAnimatingClosed && screen.isAnimatingClosed()) {
//         await screen.waitForCloseAnimation();
//         return;
//       }
//       await new Promise(resolve => {
//         // The .start() callback for `.spring(` doesn't fire, :( ..using timing temporarily instead..
//         timing(transition.progress, {
//           toValue: 1,
//           // Spring Config:
//           // https://github.com/react-navigation/react-navigation-stack/blob/6b10e8afd681c8aa81d785791f4f41f1d3647b51/src/views/StackView/StackViewTransitionConfigs.js#L12
//           // stiffness: 1000,
//           // damping: 500,
//           // mass: 3,

//           // Sad timing Config:
//           easing: Easing.inOut(Easing.cubic),
//           duration: 250
//         }).start(resolve);
//       });
//     }
//   };
//   _panGesture = React.createRef();
//   _gestureVelocityX = new Value(0);
//   _gestureTranslateX = new Value(0);
//   _gestureLastVelocityX = new Value(0);
//   _gestureLastTranslateX = new Value(0);
//   _gesturePrevTranslateX = new Value(0);
//   _gestureState = new Value(State.END);
//   _clock = new Clock();
//   _offsetX = new Value();
//   _isClosing = and(
//     neq(this._gestureState, State.ACTIVE),
//     greaterThan(
//       add(
//         this._gestureLastTranslateX,
//         multiply(TOSS_SEC, this._gestureLastVelocityX)
//       ),
//       100
//     )
//   );
//   _springState = {
//     finished: new Value(0),
//     velocity: new Value(0),
//     position: new Value(0),
//     time: new Value(0)
//   };

//   isAnimatingClosed = () => {
//     return this._isClosingViaGesture;
//   };
//   _animationCloseSubscribers = [];
//   waitForCloseAnimation = async () => {
//     await new Promise((resolve, reject) => {
//       this._animationCloseSubscribers.push(resolve);
//       setTimeout(reject, 2000);
//     });
//   };

//   _springConfig = {
//     stiffness: 1000,
//     damping: 500,
//     mass: 3,
//     overshootClamping: true,
//     restSpeedThreshold: 0.001,
//     restDisplacementThreshold: 0.001,
//     toValue: new Value()
//   };

//   _renderWithLayout = layout => {
//     const { transition } = this.props;

//     // spring logic inspired by https://github.com/kmagiera/react-native-reanimated/blob/master/Example/snappable/index.js#L30

//     const gesturePosition = [
//       cond(
//         eq(this._gestureState, State.ACTIVE),
//         [
//           stopClock(this._clock),
//           set(
//             this._offsetX,
//             add(
//               this._offsetX,
//               sub(this._gestureTranslateX, this._gesturePrevTranslateX)
//             )
//           ),
//           // transition &&
//           //   set(
//           //     transition.progress,
//           //     divide(
//           //       add(
//           //         this._offsetX,
//           //         sub(this._gestureTranslateX, this._gesturePrevTranslateX)
//           //       ),
//           //       layout.width
//           //     )
//           //   ),
//           set(this._gesturePrevTranslateX, this._gestureTranslateX),
//           set(this._gestureLastTranslateX, this._gestureTranslateX),
//           set(this._gestureLastVelocityX, this._gestureVelocityX),
//           this._offsetX
//         ],
//         [
//           set(this._gesturePrevTranslateX, 0),
//           set(
//             this._offsetX,
//             cond(
//               defined(this._offsetX),
//               [
//                 cond(clockRunning(this._clock), 0, [
//                   set(this._springState.finished, 0),
//                   set(this._springState.velocity, this._gestureVelocityX),
//                   set(this._springState.position, this._offsetX),
//                   set(
//                     this._springConfig.toValue,
//                     cond(this._isClosing, layout.width, 0)
//                   ),
//                   startClock(this._clock)
//                 ]),
//                 spring(this._clock, this._springState, this._springConfig),
//                 cond(this._springState.finished, stopClock(this._clock)),
//                 call(
//                   [and(this._springState.finished, this._isClosing)],
//                   states => {
//                     const [isComplete] = states;
//                     if (isComplete) {
//                       this._animationCloseSubscribers.forEach(closeSubscriber =>
//                         closeSubscriber()
//                       );
//                       this._animationCloseSubscribers = [];
//                       this._springState = {
//                         finished: new Value(0),
//                         velocity: new Value(0),
//                         position: new Value(0),
//                         time: new Value(0)
//                       };
//                     }
//                   }
//                 ),
//                 this._springState.position
//               ],
//               0
//             )
//           )
//         ]
//       )
//     ];
//     let cardTranslateX = gesturePosition;

//     if (
//       transition &&
//       transition.transitionRouteKey === this.props.navigation.state.key &&
//       !this._isClosingViaGesture
//     ) {
//       const { progress, fromState, toState } = transition;
//       const isForward = toState.index >= fromState.index;

//       const transitionTranslate = multiply(
//         isForward ? sub(1, progress) : progress,
//         layout.width
//       );
//       cardTranslateX = add(gesturePosition, transitionTranslate);
//     }

//     return (
//       <React.Fragment>
//         <PanGestureHandler
//           minOffsetX={10}
//           hitSlop={{ right: 0, width: 100 }}
//           onHandlerStateChange={event(
//             [
//               {
//                 nativeEvent: {
//                   state: this._gestureState
//                 }
//               }
//             ],
//             {
//               listener: ({ nativeEvent }) => {
//                 // this is not firing :(
//                 debugger;
//               }
//             }
//           )}
//           // :(
//           // ExceptionsManager.js:84 Warning: Failed prop type: Invalid prop `onHandlerStateChange` of type `object` supplied to `Handler`, expected `function`.
//           //   in Handler (at CardTransition.js:173)
//           //   in CardTransition (at App.js:177)
//           //   in CardExample (at Transitioner.js:197)
//           //   in RCTView (at View.js:43)
//           //   in AnimatedComponent (at Transitioner.js:192)
//           //   in Transitioner (at createNavigator.js:48)
//           //   in Navigator (at createNavigationContainer.js:315)
//           //   in NavigationContainer (at App.js:451)
//           //   in RCTView (at View.js:43)
//           //   in RCTView (at View.js:43)
//           //   in InternalLayoutProvider (at LayoutContext.js:244)
//           //   in LayoutProvider (at App.js:450)
//           //   in App (at renderApplication.js:32)
//           //   in RCTView (at View.js:43)
//           //   in RCTView (at View.js:43)
//           //   in AppContainer (at renderApplication.js:31)
//           onGestureEvent={event(
//             [
//               {
//                 nativeEvent: {
//                   translationX: this._gestureTranslateX,
//                   velocityX: this._gestureVelocityX
//                 }
//               }
//             ],
//             {
//               listener: ({ nativeEvent }) => {
//                 // this is not firing :(
//                 debugger;
//               }
//             }
//           )}
//           ref={this._panGesture}
//         >
//           <Animated.View
//             style={{
//               shadowColor: "#000",
//               shadowOffset: { width: 0, height: 0 },
//               shadowRadius: 5,
//               shadowOpacity: interpolate(cardTranslateX, {
//                 inputRange: [0, layout.width],
//                 outputRange: [0.2, 0],
//                 extrapolate: "clamp"
//               }),
//               backgroundColor: "#E9E9EF",
//               flex: 1,
//               opacity: 1,
//               transform: [
//                 {
//                   translateX: interpolate(cardTranslateX, {
//                     inputRange: [0, layout.width],
//                     outputRange: [0, layout.width],
//                     extrapolate: "clamp"
//                   })
//                 }
//               ]
//             }}
//           >
//             {this.props.children}
//           </Animated.View>
//         </PanGestureHandler>
//         <Animated.Code
//           exec={call([this._isClosing], values => {
//             const [isClosing] = values;
//             const wasClosing = this._isClosingViaGesture;

//             if (isClosing && !wasClosing) {
//               this._isClosingViaGesture = true;
//               this.props.navigation.goBack();
//             }
//           })}
//         />
//       </React.Fragment>
//     );
//   };
//   render() {
//     return <Consumer>{this._renderWithLayout}</Consumer>;
//   }
// }
