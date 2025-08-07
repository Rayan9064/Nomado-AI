'use client';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span 
      className={`inline-block bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 ${className}`}
      style={{
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        display: 'inline-block',
        // Ensure the gradient is applied properly
        backgroundSize: '100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </span>
  );
}
