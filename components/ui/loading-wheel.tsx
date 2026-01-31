import React from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface Props {
  size?: number;
  rimColor?: string;
  tireColor?: string;
  spokeColor?: string;
  speed?: number; // ms per rotation
}

const LoadingWheel: React.FC<Props> = ({
  size = 88,
  rimColor = "#16A34A",
  tireColor = "#111827",
  spokeColor = "#ffffff",
  speed = 900,
}) => {
  const spin = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin, speed]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spokes = Array.from({ length: 6 }).map((_, i) => {
    const angle = (360 / 6) * i;
    return (
      <View
        key={i}
        style={[
          styles.spoke,
          {
            backgroundColor: spokeColor,
            height: size * 0.42,
            left: size / 2 - (size * 0.02) / 2,
            top: size / 2 - (size * 0.42) / 2,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tireColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: size * 0.78,
              height: size * 0.78,
              borderRadius: (size * 0.78) / 2,
              borderWidth: Math.max(2, Math.round(size * 0.06)),
              borderColor: rimColor,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: size * 0.78,
                height: size * 0.78,
              }}
            >
              {spokes}
            </View>

            <View
              style={{
                width: size * 0.28,
                height: size * 0.28,
                borderRadius: (size * 0.28) / 2,
                backgroundColor: rimColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  spoke: {
    position: "absolute",
    width: 4,
    borderRadius: 2,
    opacity: 0.95,
  },
});

export default LoadingWheel;
