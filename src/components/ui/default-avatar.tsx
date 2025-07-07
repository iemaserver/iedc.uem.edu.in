import React from 'react';

interface DefaultAvatarProps {
  name?: string;
  size?: number;
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  name = "User", 
  size = 128, 
  className = "" 
}) => {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];
  
  // Simple hash function to get consistent color for same name
  const getColorIndex = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colors.length;
  };

  const bgColor = colors[getColorIndex(name)];

  return (
    <div 
      className={`${bgColor} ${className} flex items-center justify-center text-white font-bold`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
};

export default DefaultAvatar;
