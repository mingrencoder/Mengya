/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import { SettingsProvider } from './lib/SettingsContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Travels } from './pages/Travels';
import { Bookmarks } from './pages/Bookmarks';
import { Admin } from './pages/Admin';
import { SettingsPage } from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="travels" element={<Travels />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="admin" element={<Admin />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </SettingsProvider>
  );
}
