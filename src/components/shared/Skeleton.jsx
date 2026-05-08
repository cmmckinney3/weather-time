import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-md ${className}`} aria-hidden="true" />
);

export const WeatherSkeleton = () => (
  <div className="max-w-7xl mx-auto" aria-busy="true" aria-label="Loading weather data">
    {/* Station header skeleton */}
    <div className="glass-panel p-5 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="hidden sm:flex flex-col gap-2 pl-6 border-l border-cockpit-border">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>

    {/* Tab bar skeleton */}
    <Skeleton className="h-12 w-full mb-6 rounded-xl" />

    {/* Cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  </div>
);
