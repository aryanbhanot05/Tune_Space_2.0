import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PointsService from '../lib/pointsService';

interface PointsDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
  onPress?: () => void;
}

export function PointsDisplay({ 
  size = 'medium', 
  showLabel = true,
  style,
  onPress
}: PointsDisplayProps) {
  const [points, setPoints] = useState<number>(0);
  const pointsService = PointsService.getInstance();

  useEffect(() => {
    // Initialize and load points
    pointsService.initialize().then(setPoints);

    // Subscribe to points changes
    const unsubscribe = pointsService.subscribe((newPoints) => {
      setPoints(newPoints);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sizeStyles = {
    small: { icon: 16, text: 14, container: { paddingHorizontal: 8, paddingVertical: 4 } },
    medium: { icon: 20, text: 16, container: { paddingHorizontal: 12, paddingVertical: 6 } },
    large: { icon: 24, text: 20, container: { paddingHorizontal: 16, paddingVertical: 8 } },
  };

  const currentSize = sizeStyles[size];

  const content = (
    <View style={[styles.container, currentSize.container, style]}>
      <Ionicons 
        name="star" 
        size={currentSize.icon} 
        color="#FFD700" 
        style={styles.icon}
      />
      <Text style={[styles.pointsText, { fontSize: currentSize.text }]}>
        {points.toLocaleString()}
      </Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: currentSize.text - 4 }]}>
          {points === 1 ? 'point' : 'points'}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  icon: {
    marginRight: 6,
  },
  pointsText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 4,
  },
  label: {
    color: '#FFD700',
    opacity: 0.8,
  },
});

