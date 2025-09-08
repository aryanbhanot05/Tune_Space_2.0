import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabsLayout(){
    return(
        <Tabs screenOptions={{tabBarActiveTintColor: 'skyblue', headerShown: false, tabBarInactiveBackgroundColor: '#071e3aff', tabBarActiveBackgroundColor: '#071e3aff', tabBarInactiveTintColor: 'white' }}>
            <Tabs.Screen
            name="main"
            options={{
                title: 'Home',
                tabBarIcon: ({color}) => <FontAwesome size={20} name="home" color={color}/>,
            }}
            />
            <Tabs.Screen
            name="search"
            options={{
                title: 'Search',
                tabBarIcon: ({color}) => <FontAwesome size={20} name="search" color={color}/>,
            }}
            />
            <Tabs.Screen
            name="library"
            options={{
                title: 'Library',
                tabBarIcon: ({color}) => <FontAwesome size={20} name="book" color={color}/>,
            }}
            />
            <Tabs.Screen
            name="settings"
            options={{
                title: 'Settings',
                tabBarIcon: ({color}) => <FontAwesome size={20} name="cogs" color={color}/>,
            }}
            />
        </Tabs>
    );
}