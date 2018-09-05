import React from "react";
import Animated, { Easing } from "react-native-reanimated";
const { Value, timing, interpolate } = Animated;

export default class FadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: transition => ({
      ...transition,
      progress: new Value(0)
    }),
    runTransition: transition =>
      new Promise(resolve => {
        timing(transition.progress, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.cubic)
        }).start(resolve);
      })
  };
  render() {
    const { transition, navigation } = this.props;
    const myKey = navigation.state.key;
    let opacity = 1;
    if (transition) {
      const { fromState, toState, progress } = transition;
      const fromOpacity = fromState.routes.find(r => r.key === myKey) ? 1 : 0;
      const toOpacity = toState.routes.find(r => r.key === myKey) ? 1 : 0;
      opacity = interpolate(progress, {
        inputRange: [0, 1],
        outputRange: [fromOpacity, toOpacity]
      });
    }
    return (
      <Animated.View style={{ flex: 1, opacity }}>
        {this.props.children}
      </Animated.View>
    );
  }
}
