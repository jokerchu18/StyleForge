import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ToolPage from './pages/ToolPage';
import BlogPage from './pages/BlogPage';
import ExplorePage from './pages/ExplorePage';
import CreateStylePage from './pages/CreateStylePage';
import StyleDetailPage from './pages/StyleDetailPage';
import CreationsPage from './pages/CreationsPage';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import { AccountProvider } from './hooks/useAccount';

export default function App() {
  return (
    <BrowserRouter>
      <AccountProvider>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/image-to-image" element={<ToolPage />} />
        <Route path="/all-styles" element={<ExplorePage />} />
        <Route path="/styles/:id" element={<StyleDetailPage />} />
        <Route path="/create-style" element={<CreateStylePage />} />
        <Route path="/creations" element={<CreationsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/blog" element={<BlogPage />} />
        {/* Legacy aliases */}
        <Route path="/tool" element={<Navigate to="/image-to-image" replace />} />
        <Route path="/explore" element={<Navigate to="/all-styles" replace />} />
        <Route path="/create" element={<Navigate to="/create-style" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<HomePage />} />
        </Routes>
      </AccountProvider>
    </BrowserRouter>
  );
}
