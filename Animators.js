import Animated, { Easing } from 'react-native-reanimated';

export const createScreenSpringAnimator = toValue => progress =>
	new Promise(resolve => {
		if (Platform.OS === 'ios' && supportsImprovedSpringAnimation()) {
			Animated.spring(progress, {
				toValue,
				stiffness: 5000,
				damping: 600,
				mass: 3,
				useNativeDriver: true,
			}).start(resolve);
		} else {
			Animated.timing(progress, {
				toValue,
				duration,
				easing: EaseInOut,
				useNativeDriver: true,
			}).start(resolve);
		}
	});
