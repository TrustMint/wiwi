import React from 'react';

// FIX: The GlassPanelProps interface did not accept standard HTML attributes like 'role'.
// It has been updated to extend React.HTMLAttributes<HTMLDivElement> to allow pass-through of any valid div attribute,
// making the component more flexible and accessible.
interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', ...rest }) => {
  return (
    <div
      className={`bg-black/40 backdrop-blur-2xl ring-1 ring-white/10 rounded-xl shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
