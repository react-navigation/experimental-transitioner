import { createNavigator, StackRouter } from '@react-navigation/core';
import Transitioner from './Transitioner';

export default function createStackTransitionNavigator(
  routeConfigs,
  options = {}
) {
  const router = StackRouter(routeConfigs, options);

  return createNavigator(Transitioner, router, options);
}
