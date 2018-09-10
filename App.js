import React from "react";
import { View, Button } from "react-native";
import {
  createSwitchNavigator,
  createNavigationContainer,
} from "react-navigation";
import ExampleA from "./ExampleA";
import ExampleB from "./ExampleB";
import ExampleC from "./ExampleC";
import ExampleD from "./ExampleD";
import ExampleE from "./ExampleE";
import ExampleT from "./ExampleT";
import ExampleS from "./ExampleS";
import ExampleZ from "./ExampleZ";

import { Provider as LayoutProvider } from "./LayoutContext";

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
  ExampleA,
  ExampleB,
  ExampleC,
  ExampleD,
  ExampleE,
  ExampleT,
  ExampleS,
  ExampleZ,
};

const AppNavigator = createSwitchNavigator({
  Examples,
  ...EXAMPLES,
});

const StatefulAppNavigator = createNavigationContainer(AppNavigator);

const App = () => (
  <LayoutProvider style={{ flex: 1 }}>
    <StatefulAppNavigator />
  </LayoutProvider>
);

export default App;
