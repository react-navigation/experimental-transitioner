import React from "react";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
const { interpolate, timing, Value } = Animated;
import { Consumer } from "./LayoutContext";

const BasicModalTransitionWithLayout = ({
  transition,
  navigation,
  children,
  layout
}) => {
  const myKey = navigation.state.key;
  let opacity = 1;
  let transform = [];
  if (transition) {
    const { fromState, toState, progress } = transition;
    const fromKey = fromState.routes[fromState.index].key;
    const toKey = toState.routes[toState.index].key;
    const fromOpacity = myKey === fromKey ? 1 : 0;
    const toOpacity = myKey === toKey ? 1 : 0;
    console.log({ myKey, fromOpacity, toOpacity, toKey });
    opacity = interpolate(progress, {
      inputRange: [0, 1],
      outputRange: [fromOpacity, toOpacity]
    });
    const translateDist = layout.height;
    const fromTranslate = myKey === fromKey ? 0 : translateDist;
    const toTranslate = myKey === toKey ? 0 : translateDist;
    console.log("interpolating from ", { fromTranslate, toTranslate });
    transform = [
      {
        translateY: interpolate(progress, {
          inputRange: [0, 1],
          outputRange: [fromTranslate, toTranslate]
        })
      }
    ];
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Animated.View
          useNativeDriver={true}
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity,
            backgroundColor: "#0009"
          }}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        useNativeDriver={true}
        style={{
          flex: 1,
          transform,
          margin: 50
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const BasicModalTransition = props => (
  <Consumer>
    {layout => <BasicModalTransitionWithLayout {...props} layout={layout} />}
  </Consumer>
);

BasicModalTransition.navigationOptions = {
  createTransition: transition => {
    return { ...transition, progress: new Value(0) };
  },
  runTransition: transition =>
    new Promise(resolve => {
      timing(transition.progress, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.cubic)
      }).start(resolve);
    })
};

export default BasicModalTransition;
