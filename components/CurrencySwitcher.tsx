import React from 'react';
import { Currency, User, UserRole } from '../types';

interface CurrencySwitcherProps {
  currentUser: User | null;
  currentCurrency: Currency;
  exchangeRate: number;
  onCurrencyChange: (currency: Currency) => void;
  onRateChange: (rate: number) => void;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ currentUser, currentCurrency, exchangeRate, onCurrencyChange, onRateChange }) => {
  const canEditRate = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6">
      <div>
        <span className="text-sm font-medium text-gray-600 mr-2">Moneda:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => onCurrencyChange('USD')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${currentCurrency === 'USD' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => onCurrencyChange('CUP')}
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${currentCurrency === 'CUP' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
          >
            CUP
          </button>
        </div>
      </div>
      {canEditRate && (
          <div className="flex items-center gap-2">
            <label htmlFor="exchangeRate" className="text-sm font-medium text-gray-600">Tasa:</label>
            <input
              type="number"
              id="exchangeRate"
              value={exchangeRate}
              onChange={(e) => onRateChange(Number(e.target.value) || 0)}
              className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
          </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;