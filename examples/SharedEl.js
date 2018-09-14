import React from "react";
import {
  Text,
  Button,
  View,
  TouchableWithoutFeedback,
  Image,
  SafeAreaView,
  ScrollView,
} from "react-native";
import createTransitionNavigator from "../Transitioner";

import { SharedView, SharedText, SharedFadeTransition } from "../Shared";

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
        <ScrollView style={{ backgroundColor: "white" }}>
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
                      key: id,
                    });
                  }}
                />
                <View style={{ alignSelf: "flex-start" }}>
                  <SharedText id={id} fontSize={22} color={"black"}>
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

const RNTitle = ({ children }) => (
  <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 15 }}>
    {children}
  </Text>
);
const RNTextBody = ({ children }) => (
  <Text style={{ fontSize: 16 }}>{children}</Text>
);
const RNText = () => (
  <View style={{ margin: 10 }}>
    <RNTitle>Build native mobile apps using JavaScript and React:</RNTitle>
    <RNTextBody>
      React Native lets you build mobile apps using only JavaScript. It uses the
      same design as React, letting you compose a rich mobile UI from
      declarative components.
    </RNTextBody>
    <RNTitle>A React Native app is a real mobile app:</RNTitle>
    <RNTextBody>
      With React Native, you don't build a "mobile web app", an "HTML5 app", or
      a "hybrid app". You build a real mobile app that's indistinguishable from
      an app built using Objective-C, Java, or Swift. React Native uses the same
      fundamental UI building blocks as regular iOS and Android apps. You just
      put those building blocks together using JavaScript and React.
    </RNTextBody>
    <RNTitle>Don't waste time recompiling:</RNTitle>
    <RNTextBody>
      React Native lets you build your app faster. Instead of recompiling, you
      can reload your app instantly. With hot reloading, you can even run new
      code while retaining your application state. Give it a try - it's a
      magical experience.
    </RNTextBody>
    <RNTitle>Use native code when you need to:</RNTitle>
    <RNTextBody>
      React Native combines smoothly with components written in Objective-C,
      Java, or Swift. It's simple to drop down to native code if you need to
      optimize a few aspects of your application. It's also easy to build part
      of your app in React Native, and part of your app using native code
      directly - that's how the Facebook app works.
    </RNTextBody>
  </View>
);

class Product extends React.Component {
  static navigationOptions = SharedFadeTransition.navigationOptions;

  render() {
    const { navigation } = this.props;
    const product = PRODUCTS[navigation.getParam("id")];
    return (
      <SharedFadeTransition {...this.props} ref={this.props.transitionRef}>
        <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
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
            <Button
              onPress={() => {
                navigation.goBack();
              }}
              title="Go back"
            />

            <View style={{ flexDirection: "row" }}>
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
            </View>

            <RNText />
          </View>
        </ScrollView>
      </SharedFadeTransition>
    );
  }
}

const App = createTransitionNavigator({
  Home,
  Product,
});

export default App;
