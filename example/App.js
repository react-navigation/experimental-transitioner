import React from 'react';
import Expo from 'expo';

import { View, Button } from 'react-native';
import { createSwitchNavigator } from '@react-navigation/core';
import { createAppContainer } from '@react-navigation/native';
import Fade from './src/examples/Fade';
import Modal from './src/examples/Modal';
import Gesture from './src/examples/Gesture';
import CardStack from './src/examples/CardStack';
import SharedEl from './src/examples/SharedEl';

import { Provider as LayoutProvider } from './src/LayoutContext';

process.env.REACT_NAV_LOGGING = true;

const Examples = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center' }}>
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

const StatefulAppNavigator = createAppContainer(AppNavigator);

// const StatefulAppNavigator = createAppContainer(Fade);
// const StatefulAppNavigator = createAppContainer(Modal);
// const StatefulAppNavigator = createAppContainer(Gesture);
// const StatefulAppNavigator = createAppContainer(CardStack);
// const StatefulAppNavigator = createAppContainer(SharedEl);

const App = () => (
  <LayoutProvider style={{ flex: 1 }}>
    <StatefulAppNavigator />
  </LayoutProvider>
);

Expo.registerRootComponent(App);
