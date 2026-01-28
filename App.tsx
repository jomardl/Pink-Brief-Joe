import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BriefFlow from './pages/BriefFlow';
import BriefRepository from './pages/BriefRepository';
import BriefView from './pages/BriefView';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/new" element={<BriefFlow />} />
        <Route path="/briefs" element={<BriefRepository />} />
        <Route path="/brief/:id" element={<BriefView />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
