import React from "react";
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { createNavigator, StackRouter } from "react-navigation";
import { Transitioner } from "../Transitioner";
import Animated, { Easing } from "react-native-reanimated";
const { Value, timing, interpolate } = Animated;

class FadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: transition => ({
      ...transition,
      progress: new Value(0),
    }),
    runTransition: transition =>
      new Promise(resolve => {
        timing(transition.progress, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
        }).start(resolve);
      }),
  };
  render() {
    const {
      transition,
      navigation,
      transitioningFromState,
      transitioningToState,
      transitionRouteKey,
    } = this.props;
    const myKey = navigation.state.key;
    let opacity = 1;
    let transform = [];
    if (transitionRouteKey && transition) {
      const { progress } = transition;
      const wasVisible = !!transitioningFromState.routes.find(
        r => r.key === myKey,
      );
      const isVisible = !!transitioningToState.routes.find(
        r => r.key === myKey,
      );
      const fromOpacity = wasVisible ? 1 : 0;
      const toOpacity = isVisible ? 1 : 0;

      const fromTranslate = wasVisible ? 0 : 300;
      const toTranslate = isVisible ? 0 : 300;
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
    }
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
