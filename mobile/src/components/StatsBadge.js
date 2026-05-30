import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatsBadge = ({ 
  icon, 
  value, 
  label, 
  color = '#4F46E5',
  size = 'medium',
  style 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          iconSize: 20,
          valueSize: 18,
          labelSize: 10,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          iconSize: 36,
          valueSize: 28,
          labelSize: 14,
        };
      default: // medium
        return {
          container: styles.mediumContainer,
          iconSize: 28,
          valueSize: 22,
          labelSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons 
          name={icon} 
          size={sizeStyles.iconSize} 
          color={color} 
        />
      </View>
      
      <Text style={[styles.value, { color, fontSize: sizeStyles.valueSize }]}>
        {value}
      </Text>
      
      <Text style={[styles.label, { fontSize: sizeStyles.labelSize }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallContainer: {
    padding: 12,
    borderRadius: 8,
  },
  mediumContainer: {
    padding: 16,
    borderRadius: 12,
  },
  largeContainer: {
    padding: 20,
    borderRadius: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StatsBadge;
