import React from 'react';
import {
  Button,
  Text as UnstyledText,
  View as UnstyledView,
} from 'react-native';
import { createNavigator, StackRouter } from '@react-navigation/core';
import { Transitioner } from 'react-navigation-transitioner';
import FadeTransition from '../FadeTransition';

const View = props => (
  <UnstyledView
    style={{ flex: 1, justifyContent: 'center', backgroundColor: '#eee' }}
    {...props}
  />
);
const Text = props => (
  <UnstyledText style={{ textAlign: 'center' }} {...props} />
);

const HomeScreen = ({ navigation }) => (
  <View>
    <Text>Home Screen</Text>
    <Button
      onPress={() => {
        navigation.navigate('ProfileScreen', { name: 'Jane' });
      }}
      title="Go to Jane's profile"
    />
    <Button
      onPress={() => {
        navigation.navigate('Examples');
      }}
      title="Exit"
    />
  </View>
);

class ProfileScreen extends React.Component {
  static navigationOptions = FadeTransition.navigationOptions;
  render() {
    const { navigation } = this.props;
    return (
      <FadeTransition {...this.props}>
        <View>
          <Text>
            {navigation.getParam('name')}
            's Profile
          </Text>
          <Button
            onPress={() => navigation.push('HomeScreen')}
            title="Go Home"
          />
          <Button onPress={() => navigation.goBack()} title="Go Back" />
        </View>
      </FadeTransition>
    );
  }
}

const App = createNavigator(
  Transitioner,
  StackRouter({
    HomeScreen,
    ProfileScreen,
  }),
  {}
);

export default App;
