import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function CategoryBadge({ title, isActive, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-orange-500' : 'bg-slate-100'
      }`}
    >
      <Text
        className={`font-semibold ${
          isActive ? 'text-white' : 'text-slate-600'
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
