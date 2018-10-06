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

const TOSS_VELOCITY_MULTIPLIER = 0.5;

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
              -0.5,
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
      const lastGestureTranslateX = new Value(0);
      const lastGestureVelocityX = new Value(0);

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
      const targetProgressDistance = multiply(
        cond(isClosing, 0, targetProgress),
        screenWidth,
      );
      const progressDistance = new Value(0);
      const isAtRest = and(
        not(clockRunning(clock)),
        neq(gestureState, State.ACTIVE),
      );
      const uprightGestureTranslateX = multiply(gestureTranslateX, -1);
      const uprightGestureVelocityX = multiply(gestureVelocityX, -1);
      const state = {
        finished: new Value(0),
        velocity: new Value(0),
        position: progressDistance,
        time: new Value(0),
      };

      const config = {
        stiffness: 1000,
        damping: 600,
        mass: 3,
        overshootClamping: true,
        restSpeedThreshold: 0.1,
        restDisplacementThreshold: 1,
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
      const gestureProgressDistance = add(
        progressDistance,
        sub(uprightGestureTranslateX, prevGestureTranslateX),
      );
      const clampedGestureProgressDistance = cond(
        greaterThan(screenWidth, gestureProgressDistance),
        gestureProgressDistance,
        screenWidth,
      );
      const springProgressDistance = block([
        cond(
          eq(gestureState, State.ACTIVE),
          [
            stopClock(clock),
            set(progressDistance, clampedGestureProgressDistance),
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
        transition.navigation.goBack(transition.transitionRouteKey);
      };
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
    runTransition: async (transition, _, fromState, toState) => {
      const destVal = toState.index >= fromState.index ? 1 : 0;
      transition.targetProgress.setValue(destVal);

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

    const styles = {
      transform: [
        {
          translateX: interpolate(progress, {
            inputRange: [0, 1],
            outputRange: [layout.width, 0],
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
