import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity } from 'react-native';

// Props interface for the reusable tab button
interface AnimatedTabButtonProps {
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

// Reusable component that wraps the button logic with a press-down scale animation
export default function AnimatedTabButton({ title, iconName, onPress }: AnimatedTabButtonProps) {
    // Animated value for scale transformation, initialized to 1 (full size)
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Function to handle the button shrinking on press down
    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.98, // Shrink to 98% for a subtle press effect
            duration: 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    // Function to handle the button restoring to full size on release
    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    return (
        // Apply the animation to the wrapper View
        <Animated.View
            style={[
                styles.tabBtnWrapper,
                { transform: [{ scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                style={styles.tabBtn}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1} // Disable default opacity change to use our scale animation
            >
                <Ionicons name={iconName} size={24} color="#a1cdffff" style={styles.tabIcon} />
                <Text style={styles.tabTitle}>{title}</Text>
                <Ionicons name="chevron-forward" size={24} color="#a2a2a2ff" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    tabBtnWrapper: {
        width: '100%',
        marginBottom: 12,
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffffff3b',
        width: '100%',
    },
    tabIcon: {
        marginRight: 15,
    },
    tabTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
});
