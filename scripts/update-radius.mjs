import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/index.css', 'utf8');

// 1. Update root radius variables
content = content.replace(
  '--radius: 12px;\n  --radius-sm: 8px;\n  --radius-md: 14px;\n  --radius-lg: 18px;',
  '--radius-sm: 4px;\n  --radius: 6px;\n  --radius-md: 8px;\n  --radius-lg: 12px;'
);

// 2. Buttons (999px pill buttons → 6px)
content = content.replace(
  '.btn-primary,\n.btn-ghost {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  border-radius: 999px;',
  '.btn-primary,\n.btn-ghost {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  border-radius: var(--radius);'
);

// 3. Upload dropzone
content = content.replace(
  'border: 1.5px dashed var(--pink-300);\n  border-radius: 18px;\n  background: var(--surface);',
  'border: 1.5px dashed var(--pink-300);\n  border-radius: var(--radius-md);\n  background: var(--surface);'
);

// 4. Category tab buttons
content = content.replace(
  '.category-tab {\n  position: relative;\n  padding: 8px 20px;\n  border: 1px solid var(--line);\n  border-radius: 999px;',
  '.category-tab {\n  position: relative;\n  padding: 8px 20px;\n  border: 1px solid var(--line);\n  border-radius: var(--radius);'
);

// 5. Search bar
content = content.replace(
  'border: 1px solid var(--line);\n  border-radius: 999px;\n  background: var(--surface);',
  'border: 1px solid var(--line);\n  border-radius: var(--radius);\n  background: var(--surface);'
);

// 6. Style card
content = content.replace(
  '.style-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  border: 1px solid var(--border);\n  border-radius: 14px;',
  '.style-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 7. I2I grid card
content = content.replace(
  '.i2i-styles-grid .style-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  border: 2px solid transparent;\n  border-radius: 12px;',
  '.i2i-styles-grid .style-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  border: 2px solid transparent;\n  border-radius: var(--radius-md);'
);

// 8. I2I grid card media
content = content.replace(
  '.i2i-styles-grid .style-card-media {\n  position: relative;\n  display: block;\n  overflow: hidden;\n  border-radius: 12px 12px 0 0;',
  '.i2i-styles-grid .style-card-media {\n  position: relative;\n  display: block;\n  overflow: hidden;\n  border-radius: var(--radius-md) var(--radius-md) 0 0;'
);

// 9. Photo preview
content = content.replace(
  '.photo-preview {\n  display: grid;\n  gap: 14px;\n  padding: 10px;\n  border: 1px solid var(--border);\n  border-radius: 16px;',
  '.photo-preview {\n  display: grid;\n  gap: 14px;\n  padding: 10px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 10. Photo preview image
content = content.replace(
  '.photo-preview-img {\n  display: block;\n  width: 100%;\n  max-height: 420px;\n  object-fit: contain;\n  border-radius: 10px;',
  '.photo-preview-img {\n  display: block;\n  width: 100%;\n  max-height: 420px;\n  object-fit: contain;\n  border-radius: var(--radius);'
);

// 11. I2I upload dropzone
content = content.replace(
  '.i2i-upload-area .dropzone {\n  aspect-ratio: 1 / 1;\n  padding: 32px 20px;\n  border-radius: 18px;',
  '.i2i-upload-area .dropzone {\n  aspect-ratio: 1 / 1;\n  padding: 32px 20px;\n  border-radius: var(--radius-md);'
);

// 12. I2I preview image
content = content.replace(
  '.i2i-preview-img {\n  width: 100%;\n  aspect-ratio: 1 / 1;\n  object-fit: contain;\n  border-radius: 14px;',
  '.i2i-preview-img {\n  width: 100%;\n  aspect-ratio: 1 / 1;\n  object-fit: contain;\n  border-radius: var(--radius-md);'
);

// 13. Pricing card
content = content.replace(
  '.pricing-card {\n  display: flex;\n  flex-direction: column;\n  padding: 30px 24px;\n  border: 1px solid var(--border);\n  border-radius: 16px;',
  '.pricing-card {\n  display: flex;\n  flex-direction: column;\n  padding: 30px 24px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 14. Select trigger
content = content.replace(
  '.sf-select-trigger {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  width: 100%;\n  padding: 12px 14px;\n  border: 1px solid var(--border-strong);\n  border-radius: 10px;',
  '.sf-select-trigger {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  width: 100%;\n  padding: 12px 14px;\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius);'
);

// 15. Select content
content = content.replace(
  '.sf-select-content {\n  position: relative;\n  z-index: 100;\n  min-width: var(--radix-select-trigger-width);\n  max-height: var(--radix-select-content-available-height);\n  overflow: hidden;\n  border: 1px solid var(--border);\n  border-radius: 10px;',
  '.sf-select-content {\n  position: relative;\n  z-index: 100;\n  min-width: var(--radix-select-trigger-width);\n  max-height: var(--radix-select-content-available-height);\n  overflow: hidden;\n  border: 1px solid var(--border);\n  border-radius: var(--radius);'
);

// 16. Select item
content = content.replace(
  '.sf-select-item {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 10px;\n  border-radius: 8px;',
  '.sf-select-item {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 10px;\n  border-radius: var(--radius-sm);'
);

// 17. Avatar dropdown
content = content.replace(
  '.avatar-dropdown {\n  position: absolute;\n  top: calc(100% + 8px);\n  right: 0;\n  min-width: 200px;\n  background: var(--surface);\n  border: 1px solid var(--border-strong);\n  border-radius: 14px;',
  '.avatar-dropdown {\n  position: absolute;\n  top: calc(100% + 8px);\n  right: 0;\n  min-width: 200px;\n  background: var(--surface);\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius-md);'
);

// 18. Avatar dropdown item
content = content.replace(
  '.avatar-dropdown-item {\n  display: block;\n  width: 100%;\n  padding: 9px 10px;\n  border: 0;\n  border-radius: 8px;',
  '.avatar-dropdown-item {\n  display: block;\n  width: 100%;\n  padding: 9px 10px;\n  border: 0;\n  border-radius: var(--radius-sm);'
);

// 19. Blog card
content = content.replace(
  '.blog-card {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--border);\n  border-radius: 16px;',
  '.blog-card {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 20. Compare slider
content = content.replace(
  '.compare {\n  position: relative;\n  width: 100%;\n  overflow: hidden;\n  border-radius: 16px;',
  '.compare {\n  position: relative;\n  width: 100%;\n  overflow: hidden;\n  border-radius: var(--radius-md);'
);

// 21. Model card
content = content.replace(
  '.model-card {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 4px;\n  padding: 14px 16px;\n  border: 1px solid var(--border);\n  border-radius: 12px;',
  '.model-card {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 4px;\n  padding: 14px 16px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius);'
);

// 22. Creation card
content = content.replace(
  '.creation-card {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--border);\n  border-radius: 16px;',
  '.creation-card {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 23. Creation media
content = content.replace(
  '.creation-media {\n  position: relative;\n  display: block;\n  overflow: hidden;\n  border-radius: 16px 16px 0 0;',
  '.creation-media {\n  position: relative;\n  display: block;\n  overflow: hidden;\n  border-radius: var(--radius-md) var(--radius-md) 0 0;'
);

// 24. Topnav links
content = content.replace(
  '.topnav-link {\n  padding: 7px 16px;\n  border: 1px solid transparent;\n  border-radius: 999px;',
  '.topnav-link {\n  padding: 7px 16px;\n  border: 1px solid transparent;\n  border-radius: var(--radius);'
);

// 25. Generations chip
content = content.replace(
  '.generations-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 1px solid var(--border-strong);\n  border-radius: 999px;',
  '.generations-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 1px solid var(--border-strong);\n  border-radius: var(--radius);'
);

// 26. Style card use (hover button)
content = content.replace(
  '.style-card-use {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 9px 22px;\n  border-radius: 999px;',
  '.style-card-use {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 9px 22px;\n  border-radius: var(--radius);'
);

// 27. Style card compact
content = content.replace(
  '.style-card--compact {\n  border-radius: 13px;',
  '.style-card--compact {\n  border-radius: var(--radius);'
);

content = content.replace(
  '.style-card--compact .style-card-media {\n  border-radius: 8px;',
  '.style-card--compact .style-card-media {\n  border-radius: var(--radius-sm);'
);

// 28. Dropzone compact
content = content.replace(
  '.dropzone-compact {\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  padding: 9px 16px;\n  border: 1px solid var(--brand-ring);\n  border-radius: 999px;',
  '.dropzone-compact {\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  padding: 9px 16px;\n  border: 1px solid var(--brand-ring);\n  border-radius: var(--radius);'
);

// 29. Sort dropdown (when using Radix select)
content = content.replace(
  '.sf-select-trigger.sort-dropdown {\n  width: auto;\n  gap: 8px;\n  padding: 8px 14px;\n  border: 1px solid var(--border);\n  border-radius: 999px;',
  '.sf-select-trigger.sort-dropdown {\n  width: auto;\n  gap: 8px;\n  padding: 8px 14px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius);'
);

// 30. AI Image feature card
content = content.replace(
  '.ai-image-feature {\n  padding: var(--space-6);\n  border: 1px solid var(--border);\n  border-radius: 18px;',
  '.ai-image-feature {\n  padding: var(--space-6);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 31. How card
content = content.replace(
  '.how-card {\n  padding: var(--space-6);\n  border: 1px solid var(--border);\n  border-radius: 18px;',
  '.how-card {\n  padding: var(--space-6);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-md);'
);

// 32. Style card selected::after (check mark circle - keep 50%)
// Already has border-radius: 50%, keep it

// 33. Avatar button
content = content.replace(
  '.avatar-btn {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;',
  '.avatar-btn {\n  width: 32px;\n  height: 32px;\n  border-radius: var(--radius);'
);

// 34. Style card fav button (heart)
content = content.replace(
  '.style-card-fav {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  z-index: 2;\n  display: grid;\n  place-items: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;',
  '.style-card-fav {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  z-index: 2;\n  display: grid;\n  place-items: center;\n  width: 28px;\n  height: 28px;\n  border-radius: var(--radius);'
);

// 35. Plan badge
content = content.replace(
  '.plan-badge {\n  display: inline-block;\n  padding: 0 8px;\n  border-radius: 999px;',
  '.plan-badge {\n  display: inline-block;\n  padding: 0 8px;\n  border-radius: var(--radius-sm);'
);

// 36. Style card cat badge
content = content.replace(
  '.style-card-cat {\n  flex-shrink: 0;\n  padding: 2px 8px;\n  border-radius: 999px;',
  '.style-card-cat {\n  flex-shrink: 0;\n  padding: 2px 8px;\n  border-radius: var(--radius-sm);'
);

// 37. Drop icon
// Keep as is

// 38. Site login button - pill
content = content.replace(
  '.site-login-btn {\n  padding: 8px 16px;\n  font-size: 13px;\n  border-radius: 999px;',
  '.site-login-btn {\n  padding: 8px 16px;\n  font-size: 13px;\n  border-radius: var(--radius);'
);

writeFileSync('src/index.css', content);
console.log('Done: radius system updated');