import React from "react";
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { createNavigator, StackRouter } from "react-navigation";
import { Transitioner } from "./Transitioner";
import Animated, { Easing } from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
const {
  Value,
  timing,
  interpolate,
  Clock,
  add,
  multiply,
  greaterThan,
  divide,
  cond,
  lessThan,
  set,
  clockRunning,
  startClock,
  stopClock,
  eq,
  sub,
  not,
  defined,
  spring,
  neq,
  block,
  call,
  event,
  and,
} = Animated;

const MODAL_TRANSLATE_DIST = 300;
const TOSS_VELOCITY_MULTIPLIER = 0.2;

const callWhenTrue = (val, callback) => cond(val, call([val], callback));

class FadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: transition => {
      const clock = new Clock();
      const gestureState = new Value(State.END);
      const gestureTranslateY = new Value(0);
      const prevGestureTranslateY = new Value(0);
      const gestureVelocityY = new Value(0);
      const targetProgress = new Value(0);
      const targetProgressDistance = multiply(
        targetProgress,
        MODAL_TRANSLATE_DIST,
      );
      const progressDistance = new Value(0);
      const isAtRest = and(
        not(clockRunning(clock)),
        neq(gestureState, State.ACTIVE),
      );
      const uprightGestureTranslateY = multiply(gestureTranslateY, -1);
      const uprightGestureVelocityY = multiply(gestureVelocityY, -1);
      const lastGestureTranslateY = new Value(0);
      const lastGestureVelocityY = new Value(0);
      const state = {
        finished: new Value(0),
        velocity: new Value(0),
        position: progressDistance,
        time: new Value(0),
      };

      const config = {
        stiffness: 100,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
        toValue: targetProgressDistance,
      };

      const goSpring = [
        cond(clockRunning(clock), 0, [
          set(state.finished, 0),
          set(state.velocity, uprightGestureVelocityY),
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
                sub(uprightGestureTranslateY, prevGestureTranslateY),
              ),
            ),
            set(prevGestureTranslateY, uprightGestureTranslateY),
            set(lastGestureTranslateY, uprightGestureTranslateY),
            set(lastGestureVelocityY, uprightGestureVelocityY),
          ],
          [set(prevGestureTranslateY, 0), goSpring],
        ),
        progressDistance,
      ]);
      let callbacksWaitingForRest = [];
      const atRestCallback = () => {
        callbacksWaitingForRest.forEach(cb => cb());
        callbacksWaitingForRest = [];
      };
      const waitForRest = () =>
        new Promise(resolve => {
          callbacksWaitingForRest.push(resolve);
        });
      const closingCallback = () => {
        transition.navigation.goBack(transition.transitionRouteKey);
      };
      const isClosing = and(
        neq(gestureState, State.ACTIVE),
        lessThan(
          add(
            lastGestureTranslateY,
            multiply(TOSS_VELOCITY_MULTIPLIER, lastGestureVelocityY),
          ),
          -100,
        ),
      );
      const finalDistanceProgress = block([
        springProgressDistance,
        callWhenTrue(isAtRest, atRestCallback),
        callWhenTrue(isClosing, closingCallback),
        springProgressDistance,
      ]);
      return {
        ...transition,
        gestureState,
        gestureTranslateY,
        gestureVelocityY,
        targetProgress,
        progress: divide(finalDistanceProgress, MODAL_TRANSLATE_DIST),
        waitForRest,
      };
    },
    runTransition: async transition => {
      transition.targetProgress.setValue(1);

      await transition.waitForRest();
    },
  };
  _renderModal = (transform, opacity) => {
    const { navigation } = this.props;
    return (
      <Animated.View style={{ flex: 1, opacity }}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "#0008",
            }}
          />
        </TouchableWithoutFeedback>
        <Animated.View
          style={{
            position: "absolute",
            left: 30,
            top: 30,
            right: 30,
            bottom: 30,
            transform,
          }}
        >
          {this.props.children}
        </Animated.View>
      </Animated.View>
    );
  };
  render() {
    const { transition, navigation } = this.props;
    const myKey = navigation.state.key;
    let opacity = 1;
    let transform = [];
    if (!transition) {
      return this._renderModal([], 1);
    }
    const {
      fromState,
      toState,
      progress,
      gestureState,
      gestureTranslateY,
      gestureVelocityY,
    } = transition;
    const fromOpacity = fromState.routes.find(r => r.key === myKey) ? 1 : 0;
    const toOpacity = toState.routes.find(r => r.key === myKey) ? 1 : 0;

    const fromTranslate = fromState.routes.find(r => r.key === myKey)
      ? 0
      : MODAL_TRANSLATE_DIST;
    const toTranslate = toState.routes.find(r => r.key === myKey)
      ? 0
      : MODAL_TRANSLATE_DIST;
    opacity = interpolate(progress, {
      inputRange: [0, 1],
      outputRange: [fromOpacity, toOpacity],
    });
    transform = [
      {
        translateY: interpolate(progress, {
          inputRange: [0, 1],
          outputRange: [fromTranslate, toTranslate],
        }),
      },
    ];

    return (
      <PanGestureHandler
        minOffsetY={10}
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
              translationY: gestureTranslateY,
              velocityY: gestureVelocityY,
            },
          },
        ])}
      >
        {this._renderModal(transform, opacity)}
      </PanGestureHandler>
    );
  }
}

const View = props => (
  <UnstyledView
    style={{ flex: 1, justifyContent: "center", backgroundColor: "#eee" }}
    {...props}
  />
);
const Text = props => (
  <UnstyledText style={{ textAlign: "center" }} {...props} />
);

class HomeScreen extends React.Component {
  render() {
    const { navigation } = this.props;
    return (
      <View>
        <Text>Home Screen</Text>
        <Button
          onPress={() => {
            navigation.navigate("ProfileScreen", { name: "Jane" });
          }}
          title="Go to Jane's profile"
        />
        <Button
          onPress={() => {
            navigation.navigate("Examples");
          }}
          title="Exit"
        />
      </View>
    );
  }
}

class ProfileScreen extends React.Component {
  static navigationOptions = FadeTransition.navigationOptions;
  render() {
    const { navigation } = this.props;
    return (
      <FadeTransition {...this.props}>
        <View>
          <Text>
            {navigation.getParam("name")}
            's Profile
          </Text>
          <Button onPress={() => navigation.goBack()} title="Go Back" />
        </View>
      </FadeTransition>
    );
  }
}

const App = createNavigator(
  Transitioner,
  StackRouter({
    HomeScreen,
    ProfileScreen,
  }),
);

export default App;
