import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
const { Value, timing } = Animated;

export default class FadeTransition extends React.Component {
  static navigationOptions = {
    createTransition: transition => ({
      ...transition,
      opacity: new Value(0),
    }),
    runTransition: async (transition, _, fromState, toState) => {
      const isVisible = !!toState.routes.find(
        r => r.key === transition.transitionRouteKey
      );
      await new Promise(resolve => {
        timing(transition.opacity, {
          toValue: isVisible ? 1 : 0,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
        }).start(resolve);
      });
    },
  };
  render() {
    const { transition } = this.props;
    let opacity = 1;
    if (transition) {
      opacity = transition.opacity;
    }
    return (
      <Animated.View style={{ flex: 1, opacity }}>
        {this.props.children}
      </Animated.View>
    );
  }
}
