import React from "react";
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView
} from "react-native";
import { createNavigator, StackView, StackRouter } from "react-navigation";

const View = props => (
  <UnstyledView style={{ flex: 1, justifyContent: "center" }} {...props} />
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
  </View>
);

const ProfileScreen = ({ navigation }) => (
  <View>
    <Text>
      {navigation.getParam("name")}
      's Profile
    </Text>
    <Button onPress={() => navigation.goBack()} title="Go Back" />
  </View>
);

const App = createNavigator(
  StackView,
  StackRouter({
    HomeScreen,
    ProfileScreen
  }),
  {
    mode: "modal"
  }
);

// const App = createNavigationContainer(AppNavigator)

export default App;

// import React from "react";
// import {
//   Button,
//   Text as UnstyledText,
//   View as UnstyledView
// } from "react-native";
// import { StackRouter, createNavigator, StackView } from "react-navigation";

// const View = props => (
//   <UnstyledView style={{ flex: 1, justifyContent: "center" }} {...props} />
// );
// const Text = props => (
//   <UnstyledText style={{ textAlign: "center" }} {...props} />
// );

// const HomeScreen = ({ navigation }) => (
//   <View>
//     <Text>Home Screen</Text>
//     <Button
//       onPress={() => {
//         navigation.navigate("ProfileScreen", { name: "Jane" });
//       }}
//       title="Go to Jane's profile"
//     />
//     <Button onPress={() => navigation.goBack()} title="Go Back" />
//   </View>
// );

// const ProfileScreen = ({ navigation }) => (
//   <View>
//     <Text>
//       {navigation.getParam("name")}
//       's Profile
//     </Text>
//     <Button onPress={() => navigation.goBack()} title="Go Back" />
//   </View>
// );

// const App = createNavigator(
//   StackView,
//   StackRouter({
//     HomeScreen,
//     ProfileScreen
//   }),
//   {
//     headerMode: "none",
//     mode: "modal"
//   }
// );

// export default App;
