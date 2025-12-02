import { VideoBackground } from '@/components/VideoBackground';
import { ThemeProvider } from '@/lib/themeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TabsLayout() {
    return (
        <ThemeProvider>
            <View style={styles.container}>
                <View style={styles.tabBarBackgroundOverlay}>
                    <VideoBackground />
                </View>
                <View style={styles.tabBarBackgroundOverlay2} />

                <Tabs screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#a1cdffff',
                    tabBarInactiveTintColor: '#ffffff',
                    tabBarStyle: {
                        backgroundColor: 'transparent',
                        borderTopWidth: 1,
                        borderTopColor: '#ffffff3b',
                        height: 80,
                        paddingBottom: 5,
                        paddingTop: 5,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 0,
                        zIndex: 10,
                    },
                    tabBarLabelStyle: { fontSize: 12, marginVertical: 10 },
                    tabBarItemStyle: { paddingVertical: 2 },
                }}>
                    <Tabs.Screen
                        name="main"
                        options={{
                            title: 'Home',
                            tabBarIcon: ({ color }) => <FontAwesome size={32} name="home" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="search"
                        options={{
                            title: 'Search',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="library"
                        options={{
                            title: 'Library',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="settings"
                        options={{
                            title: 'Settings',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="cogs" color={color} />,
                        }}
                    />
                </Tabs>
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBarBackgroundOverlay: {
        height: 80,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    tabBarBackgroundOverlay2: {
        height: 100,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        backgroundColor: 'transparent',
    }
});