/* eslint-disable import/no-commonjs */

module.exports = {
  /**
   * Navigators
   */
  get createStackTransitionNavigator() {
    return require('./createStackTransitionNavigator').default;
  },

  get Shared() {
    return require('./Shared');
  },

  /**
   * Views
   */
  get Transitioner() {
    return require('./Transitioner').default;
  },
};
