import React from "react";
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView
} from "react-native";
import { createNavigator, StackRouter } from "react-navigation";
import { Transitioner } from "./Transitioner";
import Animated, { Easing } from "react-native-reanimated";
const { Value, timing, interpolate } = Animated;
import FadeTransition from "./FadeTransition";

const View = props => (
  <UnstyledView
    style={{ flex: 1, justifyContent: "center", backgroundColor: "#eee" }}
    {...props}
  />
);
const Text = props => (
  <UnstyledText style={{ textAlign: "center" }} {...props} />
);

const HomeScreen = ({ navigation }) => (
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

class ProfileScreen extends React.Component {
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
        <View>
          <Text>
            {navigation.getParam("name")}
            's Profile
          </Text>
          <Button
            onPress={() => navigation.push("HomeScreen")}
            title="Go Home"
          />
          <Button onPress={() => navigation.goBack()} title="Go Back" />
        </View>
      </Animated.View>
    );
  }
}

const App = createNavigator(
  Transitioner,
  StackRouter({
    HomeScreen,
    ProfileScreen
  })
);

export default App;

// import React from "react";
// import {
//   Button,
//   Text as UnstyledText,
//   View as UnstyledView
// } from "react-native";
// import { createNavigator, StackRouter } from "react-navigation";
// import { Transitioner } from "./Transitioner";
// import FadeTransition from "./FadeTransition";

// const View = props => (
//   <UnstyledView
//     style={{ flex: 1, justifyContent: "center", backgroundColor: "#eee" }}
//     {...props}
//   />
// );
// const Text = props => (
//   <UnstyledText style={{ textAlign: "center" }} {...props} />
// );

// class HomeScreen extends React.Component {
//   static navigationOptions = FadeTransition.navigationOptions;
//   render() {
//     const { navigation } = this.props;
//     return (
//       <FadeTransition {...this.props}>
//         <View>
//           <Text>Home Screen</Text>
//           <Button
//             onPress={() => {
//               navigation.navigate("ProfileScreen", { name: "Jane" });
//             }}
//             title="Go to Jane's profile"
//           />
//           <Button
//             onPress={() => {
//               navigation.navigate("Examples");
//             }}
//             title="Exit"
//           />
//         </View>
//       </FadeTransition>
//     );
//   }
// }

// class ProfileScreen extends React.Component {
//   static navigationOptions = FadeTransition.navigationOptions;
//   render() {
//     const { navigation } = this.props;
//     return (
//       <FadeTransition {...this.props}>
//         <View>
//           <Text>
//             {navigation.getParam("name")}
//             's Profile
//           </Text>
//           <Button
//             onPress={() => navigation.push("HomeScreen")}
//             title="Go Home"
//           />
//           <Button onPress={() => navigation.goBack()} title="Go Back" />
//         </View>
//       </FadeTransition>
//     );
//   }
// }

// const App = createNavigator(
//   Transitioner,
//   StackRouter({
//     HomeScreen,
//     ProfileScreen
//   })
// );

// export default App;
