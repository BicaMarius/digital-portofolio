import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PortfolioCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'tech' | 'art' | 'gaming';
  onClick: () => void;
  projectCount?: number;
  isPrivate?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  title,
  description,
  icon: Icon,
  category,
  onClick,
  projectCount = 0,
  isPrivate = false
}) => {
  const getCategoryStyle = () => {
    switch (category) {
      case 'tech':
        return 'hover:shadow-tech-primary/20 group-hover:from-tech-primary/20 group-hover:to-tech-secondary/20';
      case 'art':
        return 'hover:shadow-art-primary/20 group-hover:from-art-primary/20 group-hover:to-art-secondary/20';
      case 'gaming':
        return 'hover:shadow-gaming-accent/20 group-hover:from-gaming-accent/20 group-hover:to-primary/20';
      default:
        return 'hover:shadow-primary/20';
    }
  };

  const getIconColor = () => {
    switch (category) {
      case 'tech':
        return 'text-tech-primary';
      case 'art':
        return 'text-art-primary';
      case 'gaming':
        return 'text-gaming-accent';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card 
      className={`
        portfolio-card group cursor-pointer p-4 h-40 flex flex-col justify-between
        hover-lift hover:shadow-2xl transition-all duration-500
        ${getCategoryStyle()}
        ${isPrivate ? 'opacity-70 border-dashed' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with Icon and Count */}
      <div className="flex items-start justify-between">
        <div className={`
          p-2 rounded-lg transition-all duration-300 group-hover:scale-110
          bg-gradient-to-br from-background/50 to-card
          ${getIconColor()}
        `}>
          <Icon className="h-6 w-6" />
        </div>
        
        {!isPrivate && (
          <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {projectCount} proiecte
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground group-hover:gradient-text transition-all duration-300">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Privacy Indicator */}
      {isPrivate && (
        <div className="absolute top-4 right-4 bg-destructive/20 text-destructive text-xs px-2 py-1 rounded-full">
          Privat
        </div>
      )}

      {/* Hover Gradient Overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl
        bg-gradient-to-br ${category === 'tech' ? 'from-tech-primary/10 to-tech-secondary/10' :
                          category === 'art' ? 'from-art-primary/10 to-art-secondary/10' :
                          'from-gaming-accent/10 to-primary/10'}
      `} />
    </Card>
  );
};