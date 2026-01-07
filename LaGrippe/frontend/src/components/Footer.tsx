/**
 * Footer Component
 * Credits and information
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
          <div className="mb-4 md:mb-0">
            <p>
              &copy; 2024 COVID-19 DataViz | Epitech ProPro Project
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <p>
              Data Source:{' '}
              <a
                href="https://github.com/CSSEGISandData/COVID-19"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Johns Hopkins CSSE
              </a>
            </p>
            <span className="hidden md:inline">•</span>
            <p>
              Inspired by:{' '}
              <a
                href="https://coronavirus.jhu.edu/map.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                JHU Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
