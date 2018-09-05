import React from "react";
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView
} from "react-native";
import { createNavigator, StackRouter } from "react-navigation";
import { Transitioner } from "./Transitioner";

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
// import createTransitionNavigator, { Transitioner } from "./Transitioner";

// const View = props => (
//   <UnstyledView
//     style={{ flex: 1, justifyContent: "center", backgroundColor: "#eee" }}
//     {...props}
//   />
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
//     <Button
//       onPress={() => {
//         navigation.navigate("Examples");
//       }}
//       title="Exit"
//     />
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
//   Transitioner,
//   StackRouter({
//     HomeScreen,
//     ProfileScreen
//   })
// );

// export default App;
