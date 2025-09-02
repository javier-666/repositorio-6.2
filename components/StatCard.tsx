
import React from 'react';
import { StatCardData } from '../types';

const StatCard: React.FC<{ data: StatCardData }> = ({ data }) => {
  const { title, value, change, changeType, icon } = data;
  const isIncrease = changeType === 'increase';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        <div className="flex items-center mt-2">
          <span className={`flex items-center text-xs font-semibold ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
            {isIncrease ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            ) : (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            )}
            {change}
          </span>
          <span className="text-xs text-gray-400 ml-1">vs el mes pasado</span>
        </div>
      </div>
      <div className={`p-3 rounded-full ${isIncrease ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
