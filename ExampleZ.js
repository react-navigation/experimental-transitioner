import React from "react";
import {
  StyleSheet,
  Text,
  Button,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Easing,
  Image,
  TouchableHighlight,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Animated from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { createNavigationContainer } from "react-navigation";
import createTransitionNavigator from "./Transitioner";
import { Provider, InsetView, KeyboardAvoiding } from "./LayoutContext";
import BasicModalTransition from "./BasicModalTransition";
import ScrollModalTransition from "./ScrollModalTransition";
import CardTransition from "./CardTransition";
import FadeTransition from "./FadeTransition";

import {
  SharedView,
  SharedText,
  SharedFadeTransition,
  SharedTranslateTransition,
} from "./Shared";

const { interpolate, Value, event, divide, multiply } = Animated;

const getNavigationOptions = (optionConfig, args) => {
  if (typeof lastOptions === "function") {
    return optionConfig(...args);
  } else if (typeof lastOptions === "object") {
    return optionConfig;
  } else {
    return {};
  }
};
const extendNavigationOptions = (lastOptions, newOptions) => (...args) => ({
  ...getNavigationOptions(lastOptions, args),
  ...getNavigationOptions(newOptions, args),
});

const PRODUCTS = {
  A: {
    image: "https://www.organicfacts.net/wp-content/uploads/blueberries.jpg",
    name: "Blueberries",
  },
  B: {
    image:
      "https://www.organicfacts.net/wp-content/uploads/sugarinstrawberries.jpg",
    name: "Strawberries",
  },
  C: {
    image:
      "https://www.organicfacts.net/wp-content/uploads/pineapplecalories.jpg",
    name: "Pineapple",
  },
};

const ProductPhoto = ({ onPress, style, id }) => {
  const i = (
    <Image
      source={{
        uri: PRODUCTS[id].image,
      }}
      style={{ flex: 1 }}
    />
  );
  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View>
          <SharedView style={style} id={id}>
            {i}
          </SharedView>
        </View>
      </TouchableWithoutFeedback>
    );
  } else {
    return (
      <SharedView style={style} id={id}>
        {i}
      </SharedView>
    );
  }
};

class Home extends React.Component {
  static navigationOptions = SharedFadeTransition.navigationOptions;
  render() {
    return (
      <SharedFadeTransition {...this.props} ref={this.props.transitionRef}>
        <ScrollView style={{ backgroundColor: "#ccf" }}>
          <SafeAreaView>
            <Button
              onPress={() => {
                this.props.navigation.navigate("FadeExample");
              }}
              title="Open Fade-In Screen"
            />
            <Button
              onPress={() => {
                this.props.navigation.navigate("BasicModalExample");
              }}
              title="Open Basic Modal"
            />
            <Button
              onPress={() => {
                this.props.navigation.navigate("ScrollModalExample");
              }}
              title="Open Scroll Modal"
            />
            <Button
              onPress={() => {
                this.props.navigation.navigate("CardExample");
              }}
              title="Open Card"
            />
          </SafeAreaView>
          {Object.keys(PRODUCTS).map(id => (
            <SafeAreaView key={id}>
              <View style={{ padding: 20, marginBottom: 80 }}>
                <ProductPhoto
                  id={id}
                  style={{ width: 200, aspectRatio: 1 }}
                  onPress={() => {
                    this.props.navigation.navigate({
                      routeName: "Product",
                      params: { id },
                      key: `product-${id}`,
                    });
                  }}
                />
                <View style={{ alignSelf: "flex-start" }}>
                  <SharedText id={id} fontSize={22} color={"blue"}>
                    {PRODUCTS[id].name}
                  </SharedText>
                </View>
              </View>
            </SafeAreaView>
          ))}
        </ScrollView>
      </SharedFadeTransition>
    );
  }
}

class SnapPositionScrollView extends React.Component {
  render() {
    return <Animated.ScrollView {...this.props} />;
  }
}
class ScrollTitleView extends React.Component {
  _scrollOffset = new Value(0);
  _onScroll = event([{ nativeEvent: { offsetY: this._scrollOffset } }]);

  render() {
    return (
      <React.Fragment>
        <SnapPositionScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 118 }}
        >
          {this.props.children}
        </SnapPositionScrollView>
        <View
          style={{ ...StyleSheet.absoluteFillObject }}
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: "#fff8",

              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: "#A7A7AA",
            }}
          >
            <Animated.View
              style={{
                paddingTop: 20,
                opacity: 1,
                flexDirection: "row",
                justifyContent: "center",
                // height: 98
                height: interpolate(this._scrollOffset, {
                  inputRange: [-100, 100],
                  outputRange: [64, 98],
                }),
              }}
            >
              <View
                style={{
                  padding: 10,
                  justifyContent: "flex-end",
                }}
              >
                <Animated.View
                  style={{
                    opacity: 0.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "600",
                      color: "rgba(0, 0, 0, .9)",
                      marginHorizontal: 16,
                    }}
                  >
                    {this.props.title}
                  </Text>
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        </View>
      </React.Fragment>
    );
  }
}
class CardExample extends React.Component {
  static navigationOptions = CardTransition.navigationOptions;
  render() {
    return (
      <CardTransition {...this.props} ref={this.props.transitionRef}>
        <ScrollTitleView title="Scroll Title" style={{ flex: 1 }}>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <KeyboardAvoiding>
            <TextInput value="Text input keyboard problem" />
          </KeyboardAvoiding>

          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <KeyboardAvoiding>
            <TextInput value="Text input. Save me, layout context!" />
          </KeyboardAvoiding>
          <Button
            onPress={() => {
              this.props.navigation.navigate("Modal2");
            }}
            title="Another modal!"
          />
          <Button
            onPress={() => {
              this.props.navigation.navigate("Product", { id: "A" });
            }}
            title="Go to Product A"
          />
          <Button
            onPress={() => {
              this.props.navigation.goBack();
            }}
            title="Go back"
          />
        </ScrollTitleView>
      </CardTransition>
    );
  }
}

class ScrollModalExample extends React.Component {
  static navigationOptions = ScrollModalTransition.navigationOptions;
  render() {
    return (
      <ScrollModalTransition {...this.props}>
        <View style={{ flex: 1 }}>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <KeyboardAvoiding>
            <TextInput value="wut" />
          </KeyboardAvoiding>

          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <Text>Such a great modal!</Text>
          <KeyboardAvoiding>
            <TextInput value="wut" />
          </KeyboardAvoiding>
          <Button
            onPress={() => {
              this.props.navigation.navigate("BasicModalExample");
            }}
            title="BasicModalExample"
          />
          <Button
            onPress={() => {
              this.props.navigation.navigate("Product", { id: "A" });
            }}
            title="Go to Product A"
          />
          <Button
            onPress={() => {
              this.props.navigation.goBack();
            }}
            title="Go back"
          />
        </View>
      </ScrollModalTransition>
    );
  }
}

class FadeExample extends React.Component {
  static navigationOptions = FadeTransition.navigationOptions;
  render() {
    return (
      <FadeTransition {...this.props}>
        <View style={{ flex: 1, backgroundColor: "#cdd" }}>
          <Text>Last modal!</Text>
          <Button
            onPress={() => {
              this.props.navigation.goBack();
            }}
            title="Go back"
          />
        </View>
      </FadeTransition>
    );
  }
}

class BasicModalExample extends React.Component {
  static navigationOptions = BasicModalTransition.navigationOptions;
  render() {
    return (
      <BasicModalTransition {...this.props}>
        <View style={{ flex: 1, backgroundColor: "#cfc" }}>
          <Text>Last modal!</Text>
          <Button
            onPress={() => {
              this.props.navigation.goBack();
            }}
            title="Go back"
          />
        </View>
      </BasicModalTransition>
    );
  }
}

class Product extends React.Component {
  static navigationOptions = SharedTranslateTransition.navigationOptions;

  render() {
    const { navigation } = this.props;
    const product = PRODUCTS[navigation.getParam("id")];
    return (
      <SharedTranslateTransition {...this.props} ref={this.props.transitionRef}>
        <ScrollView style={{ flex: 1, backgroundColor: "#fcc" }}>
          <ProductPhoto
            id={navigation.getParam("id")}
            style={{ alignSelf: "stretch", aspectRatio: 1 }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          >
            <SharedText
              color="white"
              fontSize={50}
              id={navigation.getParam("id")}
            >
              {product.name}
            </SharedText>
          </View>
          <View style={{ flex: 1 }}>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Button
              onPress={() => {
                navigation.goBack();
              }}
              title="Go back"
            />
            {Object.keys(PRODUCTS).map(id => {
              if (id === navigation.getParam("id")) {
                return null;
              }
              return (
                <ProductPhoto
                  key={id}
                  id={id}
                  onPress={() => {
                    navigation.navigate({
                      routeName: "Product",
                      params: { id },
                      key: id,
                    });
                  }}
                  style={{ width: 80, aspectRatio: 1 }}
                />
              );
            })}
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
            <Text>Product Screen {navigation.getParam("id")}</Text>
          </View>
        </ScrollView>
      </SharedTranslateTransition>
    );
  }
}

const AppNavigator = createTransitionNavigator({
  Home,
  Product,
  CardExample,
  ScrollModalExample,
  BasicModalExample,
  FadeExample,
});

const AppNavigation = createNavigationContainer(AppNavigator);

const App = () => (
  <Provider style={{ flex: 1 }}>
    <AppNavigation />
  </Provider>
);
export default App;
