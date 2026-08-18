export const en = {
  appName: 'StyleForge',
  tagline: 'Turn your photos into anime in seconds.',
  privacyPill: 'Cloud AI',
  navHome: 'Home',
  navTools: 'Tools',
  navBlog: 'Blog',
  navConverter: 'Converter',
  navStyles: 'Styles',
  navHow: 'How it works',
  appNavHome: 'Home',
  appNavHomeHint: 'Back to homepage',
  appNavTools: 'Tools',
  appNavBlog: 'Blog',
  appNavBlogHint: 'Guides & updates',
  featureApi: 'Image to Image',
  featureApiHint: 'AI style transfer',
  landingNavFeatures: 'Features',
  landingNavStyles: 'Styles',
  landingFeaturesTitle: 'Transform your photos with AI',
  landingFeaturesSubtitle:
    'Cloud AI reimagines your image with a wide range of styles — no setup, no account.',
  landingStylesTitle: 'A style for every mood',
  landingStylesSubtitle:
    'From anime looks to sci-fi, oil painting, watercolor and more.',
  landingCta: 'Start converting',

  blog: {
    title: 'Style Guides & Updates',
    subtitle: 'Tips for turning your photos into sci-fi, anime, oil painting and more.',
    empty: 'Guides are coming soon.',
  },

  homeHeroTitle: 'Turn any photo into',
  homeHeroAccent: 'a whole new style.',
  homeHeroSubtitle:
    'A free AI photo stylizer that reimagines your images in seconds — turn everyday photos into sci-fi scenes, anime art, oil paintings, sketches, watercolor and more. Pick a style, hit go, and download the result.',
  homeHeroPoints: [
    'Sci-fi, anime & more — one-click styles',
    'Cloud AI transforms your photo in seconds',
    'Free to use, no account needed',
  ],
  homeHeroCta: 'Start converting',

  stylesSectionTitle: 'Explore the style library',
  stylesSectionSubtitle:
    'From anime looks to sci-fi and classic painting styles — pick the one that fits your photo.',
  howSectionTitle: 'How it works',
  howSteps: [
    'Upload your photo',
    'Pick a style from the library',
    'We transform it with AI',
    'Download your result',
  ],
  howStepHints: [
    'Drag & drop or browse any JPG, PNG or WebP up to 10MB.',
    'Browse cloud AI styles in the sidebar.',
    'Cloud styles transform your photo with an AI provider.',
    'Export a high-quality PNG straight to your device.',
  ],

  dropTitle: 'Drop your photo here',
  dropHint: 'or click to browse (JPG / PNG)',
  pasteHint: 'You can also paste an image (Ctrl+V).',
  replaceHint: 'Replace photo',

  styleTitle: 'Choose a style',
  styleHint: 'Pick a style and transform your photo with cloud AI.',
  styles: {
    hayao: { label: 'Hayao', description: 'Ghibli-like' },
    shinkai: { label: 'Shinkai', description: 'Vivid & colorful' },
    paprika: { label: 'Paprika', description: 'Bold & graphic' },
    anime: { label: 'Anime', description: 'Japanese anime look' },
    'sci-fi': { label: 'Sci-Fi', description: 'Futuristic neon glow' },
    hk: { label: 'Hong Kong', description: 'Retro HK cinema' },
    'oil-painting': { label: 'Oil Painting', description: 'Classic canvas texture' },
    sketch: { label: 'Sketch', description: 'Pencil line drawing' },
    watercolor: { label: 'Watercolor', description: 'Soft painted washes' },
  },

  loadingModel: 'Preparing…',
  processing: 'Processing…',
  download: 'Download PNG',
  runButton: 'Transform this photo',
  tryAgain: 'Try another photo',

  compareOriginal: 'Original',
  compareResult: 'Anime',

  errorInvalidImage: 'Please choose a valid image file.',
  errorModel: 'Failed to reach the AI service. Check your connection and try again.',
  errorProcess: 'Something went wrong while processing. Please try again.',
  errorInsufficientGenerations:
    'Not enough Generations. Upgrade or wait for your monthly refresh.',
  errorProviderNotConfigured:
    'The AI service is not configured. Please try again later.',
  errorRateLimited:
    'The AI service is busy right now. Please wait a moment and try again.',
  errorTimeout:
    'The AI service took too long to respond. Please try again.',
  errorUpstream:
    'The AI service hit a problem. Please try again.',
  errorBadRequest:
    'That request could not be processed. Please try a different photo.',
  errorSessionExpired: 'Your session has expired. Please sign in again.',

  modeTitle: 'Processing mode',
  apiMode: 'API',
  apiStyleTitle: 'Cloud styles',
  apiStyleHint: 'Your photo is transformed by a cloud AI provider.',
  apiRunButton: 'Transform this photo',
  apiProcessing: 'Transforming… sending your photo to an AI provider',
  transformLabel: 'Transform',

  privacyTitle: 'Simple and transparent.',
  privacyItems: [
    'Photos are sent to an AI provider only when you transform them',
    'No account required to use the tool',
    'Your creations are yours to download',
  ],

  seo: {
    description:
      'Turn your photos into anime, sci-fi, oil painting, sketch and watercolor art instantly with cloud AI. Free — choose from a growing style library.',
  },

  create: {
    navLabel: 'Create Style',
    title: 'Create your own style',
    subtitle: 'Define a prompt, pick a model and upload a sample image. Your style is reviewed before going live.',
    label: 'Style name',
    labelPlaceholder: 'e.g. Neon Anime',
    description: 'Description',
    descriptionPlaceholder: 'A short one-liner shown under the style',
    category: 'Category',
    prompt: 'Prompt',
    promptPlaceholder: 'Describe the transformation…',
    model: 'Model',
    seed: 'Seed (optional)',
    seedPlaceholder: 'Leave empty for random',
    sampleImage: 'Sample image',
    sampleHint: 'Shown as the style preview. Upload a square image for best results.',
    submit: 'Save style',
    submitting: 'Saving…',
    success: 'Style submitted for review.',
    needLogin: 'Sign in to create a style.',
  },
} as const;

export type Messages = typeof en;
