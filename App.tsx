
import React from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ProductProvider } from './contexts/ProductContext';
import ShopPage from './pages/ShopPage';
import AdminPage from './pages/AdminPage';
import { ShoppingCartIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  return (
    <ProductProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-md sticky top-0 z-10">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-slate-800">
                    <NavLink to="/" className="flex items-center gap-2">
                      <img src="https://img.icons8.com/plasticine/100/box.png" alt="logo" className="h-8 w-8"/>
                      LXP Mart
                    </NavLink>
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    商店
                  </NavLink>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                    後台管理
                  </NavLink>
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
              © {new Date().getFullYear()} LXP Mart. All rights reserved.
            </div>
          </footer>
        </div>
      </HashRouter>
    </ProductProvider>
  );
};

export default App;