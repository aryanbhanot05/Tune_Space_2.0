import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBellProps {
  size?: number;
  color?: string;
  style?: object;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  color = '#ffffff',
  style
}) => {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    router.push('/notifications' as any);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome name="bell" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeContent}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeContent: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});