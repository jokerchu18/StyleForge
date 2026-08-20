-- Add the three new styles from style2.md (Sticker Art, Ink Illustration, Lego World)
-- These use the gpt-image-2 model (registered as "gpt-image-2" in models.ts).

insert into public.styles
  (slug, label, description, category, tags, preview_image, examples, "order", prompt, model, generation_config)
values
  ('sticker-art', 'Sticker Art', 'Turn your photo into a minimalist black-and-white hand-drawn sticker art piece.', 'Creative',
   '{sticker,illustration,line-art,minimalist}', '/styles/api/sticker-art.png', '[]', 39,
   $$Preserve the original scene, composition, perspective, buildings, streets, objects, lighting, shadows, materials, and photographic textures exactly. Change only the characters into minimalist black-and-white hand-drawn stickers, keeping their poses, actions, proportions, clothing outlines, number, and positions unchanged. Use rough single-line illustrations with only pure black and white no gray, color, or gradients with clean white sticker borders. Create a realistic high-resolution photo background contrasted with flat 2D sketch characters, in a minimalist graffiti/INS editorial collage style. Sharp, detailed, photorealistic background, 8K look. Aspect ratio: 3:4 / 9:16$$,
   'gpt-image-2', '{"replicate":{"model":"gpt-image-2"}}'),

  ('ink-illustration', 'Ink Illustration', 'Transform your photo into a minimalist ink illustration on a matte art paper backdrop.', 'Creative',
   '{ink,illustration,minimalist,oriental,art}', '/styles/api/ink-illustration.png', '[]', 40,
   $$竖向二分构图哑光米白画册明信片，画面上半部分完整保留原图写实实拍风景，不改动景物布局、轮廓、原生低饱和配色；下半部分独立米色留白区域，水墨扁平解构插画，提取原图全部景物几何极简简化，分层柔和色块，毛笔淡墨晕染笔触，无锐利硬线条，复刻原图全部色彩调性，删除全部细碎纹理、杂物、光影；整体米白哑光纸张底色，大面积留白，简约东方建筑风景研究版式，干净高级，无多余装饰。$$,
   'gpt-image-2', '{"replicate":{"model":"gpt-image-2"}}'),

  ('lego-world', 'Lego World', 'Turn your photo into a Lego brick-built world while keeping the original subject intact.', 'Worlds',
   '{lego,brick,creative,world}', '/styles/api/lego-world.png', '[]', 26,
   $$保持画面主体人物或动物不变，将画面背景改为乐高积木搭建的效果，保持原图的背景元素、色彩与构图，不要将画面主体变成乐高，不要添加画面中没有的元素$$,
   'gpt-image-2', '{"replicate":{"model":"gpt-image-2"}}')
on conflict (slug) do nothing;