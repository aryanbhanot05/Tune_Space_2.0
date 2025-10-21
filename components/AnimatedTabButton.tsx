import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface AnimatedTabButtonProps {
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

export default function AnimatedTabButton({ title, iconName, onPress }: AnimatedTabButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    return (
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
                activeOpacity={1}
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
