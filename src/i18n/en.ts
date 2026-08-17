export const en = {
  appName: 'StyleForge',
  tagline: 'Turn your photos into anime in seconds. 100% private.',
  privacyPill: '100% Private',
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
  featureBrowser: 'Img2Img · Local',
  featureBrowserHint: 'On-device anime styles',
  featureApi: 'Img2Img · Cloud',
  featureApiHint: 'Cloud AI styles',
  landingNavFeatures: 'Features',
  landingNavStyles: 'Styles',
  landingFeaturesTitle: 'Two ways to transform your photos',
  landingFeaturesSubtitle:
    'Run styles entirely on your device for privacy, or let cloud AI reimagine your image.',
  landingStylesTitle: 'A style for every mood',
  landingStylesSubtitle:
    'From on-device anime looks to cloud sci-fi, oil painting, watercolor and more.',
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
    'On-device styles never upload your photo',
    'Free to use, no account needed',
  ],
  homeHeroCta: 'Start converting',

  stylesSectionTitle: 'Explore the style library',
  stylesSectionSubtitle:
    'From on-device anime looks to cloud sci-fi and classic painting styles — pick the one that fits your photo.',
  howSectionTitle: 'How it works',
  howSteps: [
    'Upload your photo',
    'Pick a style from the library',
    'We transform it with AI',
    'Download your result',
  ],
  howStepHints: [
    'Drag & drop or browse any JPG, PNG or WebP up to 10MB.',
    'Browse on-device and cloud styles in the sidebar.',
    'On-device styles run locally; cloud styles use an AI provider.',
    'Export a high-quality PNG straight to your device.',
  ],

  dropTitle: 'Drop your photo here',
  dropHint: 'or click to browse (JPG / PNG)',
  pasteHint: 'You can also paste an image (Ctrl+V).',
  replaceHint: 'Replace photo',

  styleTitle: 'Choose a style',
  styleHint: 'The first use of each style loads its model (~8 MB), then it is cached.',
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

  loadingModel: 'Loading model…',
  processing: 'Processing… running locally on your device',
  download: 'Download PNG',
  runButton: 'Anime this photo',
  tryAgain: 'Try another photo',

  compareOriginal: 'Original',
  compareResult: 'Anime',

  errorInvalidImage: 'Please choose a valid image file.',
  errorModel: 'Failed to load the model. Check your connection and try again.',
  errorProcess: 'Something went wrong while processing. Please try again.',

  modeTitle: 'Processing mode',
  browserMode: 'Browser',
  apiMode: 'API',
  browserStyleTitle: 'On-device styles',
  browserStyleHint: 'Runs locally — your photo never leaves your device.',
  apiStyleTitle: 'Cloud styles',
  apiStyleHint: 'Your photo is sent to an AI provider for this mode.',
  apiRunButton: 'Transform this photo',
  apiProcessing: 'Transforming… sending your photo to an AI provider',
  transformLabel: 'Transform',

  privacyTitle: 'Your privacy is the point.',
  privacyItems: [
    'No upload — photos are processed entirely in your browser',
    'No account, no tracking of your images',
    'No server — the app is a static site + local AI model',
  ],

  seo: {
    description:
      'Turn your photos into anime art instantly in your browser. Free, private, no upload — choose from Hayao, Shinkai and Paprika styles.',
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
