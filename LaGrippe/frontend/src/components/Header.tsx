/**
 * Header Component
 * Navigation and branding for the dashboard
 */

import React from 'react';
import { FaVirus, FaGithub } from 'react-icons/fa';

interface HeaderProps {
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaVirus className="text-red-500 text-3xl" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                COVID-19 DataViz
              </h1>
              <p className="text-sm text-slate-400">
                Real-time Pandemic Statistics Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            <a
              href="https://github.com/CSSEGISandData/COVID-19"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="Data Source: Johns Hopkins CSSE"
            >
              <FaGithub className="text-2xl" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
