import React from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface Props {
  size?: number;
  color?: string;
  middleColor?: string;
}

const LoadingDots: React.FC<Props> = ({
  size = 10,
  color = "#86efac",
  middleColor = "#86efac",
}) => {
  const anim1 = React.useRef(new Animated.Value(0)).current;
  const anim2 = React.useRef(new Animated.Value(0)).current;
  const anim3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createLoop = (anim: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const loops = [
      createLoop(anim1, 0),
      createLoop(anim2, 150),
      createLoop(anim3, 300),
    ];
    Animated.stagger(100, loops).start();
    return () => {
      anim1.stopAnimation();
      anim2.stopAnimation();
      anim3.stopAnimation();
    };
  }, [anim1, anim2, anim3]);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1.2],
        }),
      },
    ],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          dotStyle(anim1),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: middleColor,
          },
          dotStyle(anim2),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          dotStyle(anim3),
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    marginHorizontal: 6,
  },
});

export default LoadingDots;
