import React from 'react';
import { Navigation } from '@/components/Navigation';

interface PageLayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

/**
 * PageLayout - A fluid, responsive container for all pages
 * Ensures consistent one-screen behavior across devices and aspect ratios
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ children, fullHeight = true }) => {
  return (
    <div className={`${fullHeight ? 'min-h-screen' : ''} flex flex-col bg-background`}>
      <Navigation />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
