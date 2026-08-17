import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import BlogPage from './pages/BlogPage';
import ExplorePage from './pages/ExplorePage';
import CreateStylePage from './pages/CreateStylePage';
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
        <Route path="/home" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/create" element={<CreateStylePage />} />
        <Route path="/blog" element={<BlogPage />} />
        {SEO_SLUGS.map((slug) => (
          <Route key={slug} path={`/${slug}`} element={<SeoPage slug={slug} />} />
        ))}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
