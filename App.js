import React from "react";
import { View, Button } from "react-native";
import {
  createSwitchNavigator,
  createNavigationContainer,
} from "react-navigation";
import Fade from "./examples/Fade";
import Modal from "./examples/Modal";
import Gesture from "./examples/Gesture";
import CardStack from "./examples/CardStack";
import SharedEl from "./examples/SharedEl";

import { Provider as LayoutProvider } from "./LayoutContext";

process.env.REACT_NAV_LOGGING = true;

const Examples = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    {Object.keys(EXAMPLES).map(exampleName => (
      <Button
        key={exampleName}
        onPress={() => navigation.navigate(exampleName)}
        title={exampleName}
      />
    ))}
  </View>
);

const EXAMPLES = {
  Fade,
  Modal,
  Gesture,
  CardStack,
  SharedEl,
};

const AppNavigator = createSwitchNavigator({
  Examples,
  ...EXAMPLES,
});

// const StatefulAppNavigator = createNavigationContainer(AppNavigator);
// const StatefulAppNavigator = createNavigationContainer(Fade);
// const StatefulAppNavigator = createNavigationContainer(Modal);
// const StatefulAppNavigator = createNavigationContainer(Gesture);
// const StatefulAppNavigator = createNavigationContainer(CardStack);
const StatefulAppNavigator = createNavigationContainer(SharedEl);

const App = () => (
  <LayoutProvider style={{ flex: 1 }}>
    <StatefulAppNavigator />
  </LayoutProvider>
);

export default App;
