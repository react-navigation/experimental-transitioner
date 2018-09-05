import React from "react";
import {
  StyleSheet,
  Text,
  Button,
  View,
  TextInput,
  StatusBar,
  SafeAreaView,
  Keyboard
} from "react-native";
import Animated from "react-native-reanimated";

const LayoutReactContext = React.createContext(null);

const setAnimatedValue = (animatedValues, stateObj, valueName) => {
  const val = stateObj[valueName];
  if (typeof val === "number") {
    animatedValues[valueName].setValue(val);
  }
};

class InternalLayoutProvider extends React.Component {
  state = {
    safeTop: 0,
    safeLeft: 0,
    safeBottom: 0,
    safeRight: 0,
    width: null,
    height: null,
    _kbScreenY: null,
    _hasMeasuredContainer: false,
    _hasMeasuredSafeArea: false
  };
  animated = {
    width: new Animated.Value(0),
    height: new Animated.Value(0),
    safeTop: new Animated.Value(0),
    safeBottom: new Animated.Value(0),
    safeLeft: new Animated.Value(0),
    safeRight: new Animated.Value(0)
  };
  componentDidMount() {
    if (!this.props.parentLayout) {
      this._kbWSSub = Keyboard.addListener("keyboardWillShow", e => {
        console.log("keyboardWillShow", e.endCoordinates.screenY);
        this._updateKBScreenY(e.endCoordinates.screenY);
      });
      this._kbDSSub = Keyboard.addListener("keyboardDidShow", e => {
        console.log("keyboardDidShow", e.endCoordinates.screenY);
        this._updateKBScreenY(e.endCoordinates.screenY);
      });
      this._kbWHSub = Keyboard.addListener("keyboardWillHide", e => {
        console.log("keyboardWillHide", e.endCoordinates.screenY);
        this._updateKBScreenY(e.endCoordinates.screenY);
      });
      this._kbDHSub = Keyboard.addListener("keyboardDidHide", e => {
        console.log("keyboardDidHide", e.endCoordinates.screenY);
        this._updateKBScreenY(e.endCoordinates.screenY);
      });
    }
  }
  _updateKBScreenY = _kbScreenY => {
    this._setComputedState({
      _kbScreenY
    });
  };
  componentWillUnmount() {
    this._kbWSSub && this._kbWSSub.remove();
    this._kbDSSub && this._kbDSSub.remove();
    this._kbWHSub && this._kbWHSub.remove();
    this._kbDHSub && this._kbDHSub.remove();
  }
  _setComputedState = newState => {
    const state = { ...this.state, ...newState };

    state.safeLeft = state._safeViewX;
    state.safeRight = state.width - state._safeViewX - state._safeViewWidth;
    state.safeTop = state._safeViewY;
    state.safeBottom = state.height - state._safeViewY - state._safeViewHeight;
    if (state._kbScreenY !== null) {
      const kbSafeBottom = state.height - state._kbScreenY;
      state.safeBottom = Math.max(state.safeBottom, kbSafeBottom);
    }
    this._updateAnimatedValues(state);
    if (state.width === null || state.height === null) {
      this.state = state;
    } else {
      this.setState(state);
    }
  };
  _updateAnimatedValues = state => {
    setAnimatedValue(this.animated, state, "width");
    setAnimatedValue(this.animated, state, "height");
    setAnimatedValue(this.animated, state, "safeLeft");
    setAnimatedValue(this.animated, state, "safeRight");
    setAnimatedValue(this.animated, state, "safeTop");
    setAnimatedValue(this.animated, state, "safeBottom");
  };

  _onContainerLayout = e => {
    this._setComputedState({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
      _containerX: e.nativeEvent.layout.x,
      _containerY: e.nativeEvent.layout.y,
      _hasMeasuredContainer: true
    });
  };
  _onSafeLayout = e => {
    this._setComputedState({
      _safeViewHeight: e.nativeEvent.layout.height,
      _safeViewWidth: e.nativeEvent.layout.width,
      _safeViewX: e.nativeEvent.layout.x,
      _safeViewY: e.nativeEvent.layout.y,
      _hasMeasuredSafeArea: true
    });
  };
  _renderContainerContent = () => {
    const {
      width,
      height,
      safeLeft,
      safeRight,
      safeTop,
      safeBottom,
      _safeViewHeight,
      _safeViewY,
      _containerY
    } = this.state;
    const contentContainerStyle = {
      flex: 1
    };
    const { inset, parentLayout, style, debugColor } = this.props;
    if (inset) {
      // contentContainerStyle.paddingTop = parentLayout.safeTop;
      contentContainerStyle.paddingTop = Math.min(
        parentLayout.safeTop,
        _safeViewY - _containerY
      );
      contentContainerStyle.paddingBottom = Math.min(
        parentLayout.safeBottom,
        _safeViewHeight - height - _containerY
      );
      contentContainerStyle.paddingLeft = parentLayout.safeLeft;
      contentContainerStyle.paddingRight = parentLayout.safeRight;
    }
    return (
      <LayoutReactContext.Provider
        value={{ ...this.state, animated: this.animated }}
      >
        <View style={contentContainerStyle}>{this.props.children}</View>
      </LayoutReactContext.Provider>
    );
  };
  _renderHackyPart = () => {
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          opacity: 0,
          width: this.animated.width,
          height: this.animated.height,
          paddingTop: this.animated.safeTop,
          paddingBottom: this.animated.safeBottom,
          paddingLeft: this.animated.safeLeft,
          paddingRight: this.animated.safeRight
        }}
      />
    );
  };
  _renderContainerMeasuring = () => {
    const color = this.props.debugColor;
    if (!this.state._hasMeasuredContainer) {
      return null;
    }
    return (
      <React.Fragment>
        <View style={[StyleSheet.absoluteFill, { opacity: 0 }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }} onLayout={this._onSafeLayout} />
          </SafeAreaView>
        </View>
        {this._renderHackyPart()}
        {this._renderContainerContent()}
        {color && (
          <View
            pointerEvents="none"
            style={{
              opacity: 0.5,
              position: "absolute",
              width: this.state.width,
              height: this.state.height,
              top: 0,
              right: 0,
              borderWidth: 5,
              borderColor: color
            }}
          >
            <View
              style={{
                position: "absolute",
                bottom: this.state.safeBottom,
                top: this.state.safeTop,
                right: this.state.safeRight,
                left: this.state.safeLeft,
                borderWidth: 5,
                borderColor: color,
                borderStyle: "dotted",
                margin: -5
              }}
            />
          </View>
        )}
      </React.Fragment>
    );
  };
  render() {
    const {
      width,
      height,
      safeLeft,
      safeRight,
      safeTop,
      safeBottom,
      _safeViewHeight,
      _safeViewY,
      _containerY
    } = this.state;
    const { inset, parentLayout, style, debugColor } = this.props;
    if (inset && !parentLayout) {
      throw "Cannot inset top level layout context provider";
    }
    const containerStyle = { ...StyleSheet.flatten(style) };
    return (
      <View style={containerStyle} onLayout={this._onContainerLayout}>
        {this._renderContainerMeasuring()}
      </View>
    );
  }
}

class LayoutProvider extends React.Component {
  render() {
    return (
      <LayoutReactContext.Consumer>
        {parentLayout => (
          <InternalLayoutProvider {...this.props} parentLayout={parentLayout} />
        )}
      </LayoutReactContext.Consumer>
    );
  }
}

export const KeyboardAvoiding = ({ children, color, debugColor, style }) => (
  <LayoutProvider debugColor={debugColor} style={style} inset>
    {children}
  </LayoutProvider>
);

export const InsetView = ({ children, color, debugColor, style }) => (
  <LayoutProvider debugColor={debugColor} style={style} inset>
    {children}
  </LayoutProvider>
);

//   <LayoutReactContext.Consumer>
//     {layout => (
//       <View
//         style={{
//           flex: 1,
//           paddingLeft: layout.safeLeft,
//           paddingRight: layout.safeRight,
//           paddingTop: layout.safeTop,
//           paddingBottom: layout.safeBottom,
//         }}>
//         <LayoutReactContext.Provider
//           value={{
//             width: layout.width - layout.safeLeft - layout.safeRight,
//             height: layout.height - layout.safeTop - layout.safeBottom,
//             safeLeft: 0,
//             safeTop: 0,
//             safeRight: 0,
//             safeBottom: 0,
//           }}>
//           {children}
//         </LayoutReactContext.Provider>
//       </View>
//     )}
//   </LayoutReactContext.Consumer>
// );

export const Provider = LayoutProvider;
export const Consumer = LayoutReactContext.Consumer;

// export const App = () => (
//   <LayoutContext.Provider>
//     <LayoutContext.ScrollView>
//       <View style={{ flex: 1, backgroundColor: 'red' }} />
//     </LayoutContext.ScrollView>
//   </LayoutContext.Provider>
// );
