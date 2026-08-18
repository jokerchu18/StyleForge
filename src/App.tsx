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
import SeoPage from './pages/SeoPage';

const SEO_SLUGS = [
  'photo-to-anime',
  'photo-to-cartoon',
  'anime-avatar-generator',
  'anime-filter',
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tool" element={<ToolPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/styles/:id" element={<StyleDetailPage />} />
        <Route path="/create" element={<CreateStylePage />} />
        <Route path="/creations" element={<CreationsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        {SEO_SLUGS.map((slug) => (
          <Route key={slug} path={`/${slug}`} element={<SeoPage slug={slug} />} />
        ))}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
