/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Travels } from './pages/Travels';
import { Bookmarks } from './pages/Bookmarks';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="travels" element={<Travels />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
