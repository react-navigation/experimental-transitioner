import React from "react";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

const { interpolate, add, timing, Value } = Animated;

export default class ScrollModalTransition extends React.Component {
  static navigationOptions = {
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
  _scrollView = null;
  _scrollOffset = new Animated.Value(0);
  _wasNearTopAtDragBegin = false;
  _onScrollBeginDrag = e => {
    const { contentOffset } = e.nativeEvent;
    this._wasNearTopAtDragBegin = contentOffset.y < 30; // 30px down is roughly the top, within error margin, tested by feel
  };
  _onScrollEndDrag = e => {
    const { contentOffset, velocity } = e.nativeEvent;
    const isInDismissalRange = contentOffset.y < 0;
    const isDismissalDirection = velocity.y < 0;
    if (
      this._wasNearTopAtDragBegin &&
      isInDismissalRange &&
      isDismissalDirection
    ) {
      this.props.navigation.goBack();
      // this._scrollView.scrollTo({ x: 0, y: 0, animated: true });
    }
  };
  render() {
    const { transition, navigation, children } = this.props;
    const scrollOpacity = interpolate(this._scrollOffset, {
      inputRange: [-100, 0, 1],
      outputRange: [-0.3, 0, 0]
    });
    const tranformOfScroll = interpolate(this._scrollOffset, {
      inputRange: [-1, 0, 1],
      outputRange: [1.75, 0, 0]
    });
    let opacity = add(1, scrollOpacity);
    let translateY = tranformOfScroll;
    const myKey = navigation.state.key;
    if (transition) {
      const { fromState, toState, progress } = transition;
      const fromKey = fromState.routes[fromState.index].key;
      const toKey = toState.routes[toState.index].key;
      const fromOpacity = myKey === fromKey ? 1 : 0;
      const toOpacity = myKey === toKey ? 1 : 0;
      console.log({ myKey, fromOpacity, toOpacity, toKey });
      const progressOpacity = interpolate(progress, {
        inputRange: [0, 1],
        outputRange: [fromOpacity, toOpacity]
      });
      opacity = add(scrollOpacity, progressOpacity);
      const translateDist = 1000;
      const fromTranslate = myKey === fromKey ? 0 : translateDist;
      const toTranslate = myKey === toKey ? 0 : translateDist;
      translateY = add(
        tranformOfScroll,
        interpolate(progress, {
          inputRange: [0, 1],
          outputRange: [fromTranslate, toTranslate]
        })
      );
    }
    const progress = transition ? transition.progress : new Animated.Value(1);
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
            transform: [
              {
                translateY
              }
            ],
            margin: 50
          }}
        >
          <Animated.ScrollView
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={Animated.event([
              { nativeEvent: { contentOffset: { y: this._scrollOffset } } }
            ])}
            ref={sv => {
              this._scrollView = sv;
            }}
            onScrollEndDrag={this._onScrollEndDrag}
            onScrollBeginDrag={this._onScrollBeginDrag}
            style={{
              flex: 1,
              borderRadius: 5,
              backgroundColor: "white",
              shadowOffset: { width: 10, height: 10 },
              shadowColor: "black",
              shadowOpacity: 1.0
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                transform: [
                  {
                    translateY: this._scrollOffset.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-1, 0, 0]
                    })
                  }
                ]
              }}
            >
              {children}
            </Animated.View>
          </Animated.ScrollView>
        </Animated.View>
      </View>
    );
  }
}
