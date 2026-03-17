import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false,
  className = ''
}) {
  const baseStyle = "w-full rounded-xl py-4 flex-row justify-center items-center shadow-sm";
  
  const variants = {
    primary: "bg-orange-500 active:bg-orange-600",
    secondary: "bg-slate-100 active:bg-slate-200",
    outline: "bg-transparent border-2 border-orange-500 active:bg-orange-50"
  };

  const textVariants = {
    primary: "text-white font-bold text-center text-base",
    secondary: "text-slate-800 font-bold text-center text-base",
    outline: "text-orange-500 font-bold text-center text-base"
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70' : ''}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#ea580c'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
