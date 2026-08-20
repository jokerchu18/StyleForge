-- Add the styles from style2.md (Minecraft, Magazine, Paparazzi, and the
-- google/nano-banana-2 creative prompt set). These are appended to the existing
-- catalog with on-conflict-do-nothing so re-running is safe.

insert into public.styles
  (slug, label, description, category, tags, preview_image, examples, "order", prompt, model, generation_config)
values
  ('magazine-editorial', 'Magazine', 'Transform your photo into an ultra-realistic fashion editorial with cinematic lighting and magazine-quality composition.', 'Trending',
   '{magazine,fashion,editorial,portrait,cinematic}', '/styles/api/magazine-editorial.png', '[]', 6,
   $$主题设定：超逼真的电影感肖像，高端时尚，8K质感，画幅杂志风格摄影。主体描述：仅使用上传的参考图作为主要拍摄对象，面部特征、骨骼结构和自然肤质（可见毛孔）需100%匹配，妆容与参考图角色保持一致。不得改变种族或性别特征。发型描述：与参考图人物的发型和发色保持高度一致，发丝被风吹拂，飘散在脸上，以时尚的方式部分遮挡面部特征。妆容设定：底妆通透干净，轻薄雾面带微光；眼妆自然放大，睫毛纤长，眼神清澈；唇妆水润嘟嘟唇，淡粉到蜜桃渐变，唇峰柔和。超逼真的皮肤纹理，毛孔清晰可见，细节自然，纹理细腻。服装设定：与参考图人物的上身穿搭保持高度一致。动作/动态：前景有穿着时尚的行人快速移动，动态模糊（长曝光效果）挡住部分画面和镜头。主体位于画面的右侧。构图：低角度仰拍人物，全身横幅肖像，主体人物位置偏右构图，线条简洁流畅。相机：24mm广角镜头视角，浅景深，电影感虚化效果，专业的时尚写实风格。光照：柔和的电影感光照，暖色调，营造氛围感。高光控制得当，阴影保留细节。色彩/后期：高细节，高级色彩分级，自然的肤质纹理，微妙的胶片感（无明显颗粒）。无文字、无徽标、无水印。2K HD 输出。$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('paparazzi', 'Paparazzi', 'Turn your photo into a candid paparazzi-style street shot with flash photography and natural motion.', 'Trending',
   '{paparazzi,candid,flash,street,fashion}', '/styles/api/paparazzi.png', '[]', 7,
   $$Paparazzi - style extreme close-up photo of a woman with striking facial features, caught off-guard while turning toward the camera. Face and shoulders only, shot from a low angle. Strong harsh on-camera flash, grainy high-ISO, raw candid street-photography feel. Background shows a crowded scene with motion blur (Paris Fashion Week atmosphere). Intense, spontaneous energy, imperfect and real. Ultra-realistic, cinematic realism, high detail skin texture, slight lens distortion.$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('minecraft-world', 'Minecraft', 'Turn your photo into a Minecraft-inspired voxel world with blocky textures and colorful landscapes.', 'Worlds',
   '{minecraft,voxel,block,world,sandbox}', '/styles/api/minecraft-world.png', '[]', 25,
   $$请基于用户上传的真实户外照片进行风格化改造。目标效果是：真实主体保留在原地，周围环境被完整改造成高统一度的方块体素沙盒世界，类似 Minecraft 风格的自然场景，但不要出现游戏 UI、logo、文字、怪物或额外角色。请先自动识别画面中的主要主体。如果画面中有人物或动物，请严格保留主体的外貌识别度、姿态、站位、服装、毛发、表情、身体比例、光照关系和真实摄影感；不要换脸，不要改变身份，不要把主体做成像素人或卡通角色。如果画面中没有人物或动物，请把画面中最主要的建筑、树木、车辆、器物、桥梁、飞机翼或其他视觉焦点作为主体，保留其原始位置、轮廓、结构关系和识别度，可以轻度融入方块世界，但不要彻底重绘或改变主体身份。除主体之外，请将整个环境统一改造成强烈的方块体素沙盒世界。前景、中景、远景都要完成转化，环境方块化覆盖率建议达到 80%–95%。地面应转化为阶梯式方块地形，包含清晰的草方块、泥土方块、沙地方块或石块层级。草地要接近 Minecraft 高草，轻薄、竖直、有方块感，不要变成厚重毛毯或真实草坪。水面要更平面化，带像素网格反光和块状浅滩，不要出现真实海浪或复杂浪花。树木和灌木应变成方块树干与立方体叶簇，但要保留原来的树冠位置、遮挡关系和空间层次。云朵要更浅、更轻，呈现半透明的矩形块云，不要过厚或过写实。建筑、桥、栏杆、道路、远山、岸线、小屋、灯杆等环境元素应保留原有透视和位置，但表面转化为像素贴图和清晰的体素结构。请严格保留原图的大体构图、视角、透视、焦距感、景深、光线方向、时间氛围和主体站位。最终画面应像一张真实照片中，主体仍然真实存在，但周围世界被完整改造成统一的方块体素环境。画面要清晰、自然、有空间感、有视觉冲击力，不能只局部方块化，也不能出现写实环境和体素环境混杂的问题。负面要求：不要换脸，不要改变人物身份，不要改变服装主要颜色，不要添加不存在的人、动物、文字、水印、游戏界面、怪物、武器或明显不属于原图的装饰物；不要把主体彻底像素化；不要让水面变成真实海浪；不要让草地变成厚重毛毯；不要只在局部添加方块元素。$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('food-infographic', 'Food Infographic', 'Transform food photos into detailed editorial illustrations with rich textures, visual depth, and vibrant colors.', 'Creative',
   '{food,infographic,editorial,illustration}', '/styles/api/food-infographic.png', '[]', 35,
   $${"global_settings": {"resolution": "8K ultra high definition", "style": "hyper-realistic food illustration with editorial infographic overlays", "lighting": "soft directional key light, subtle rim light"}, "scene_description": "A vertical stack of cake slices floating above a plate against soft pink gradient background", "motion_elements": ["floating fruits", "floating macarons", "crumbs suspended in air"], "text_design": {"ingredient_name_color": "metallic gold", "indicator_lines": "long, thin, smooth golden lines with rounded corners"}}$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('isometric-map', 'Isometric Map', 'Turn your image into a hand-drawn isometric map with architectural details and technical precision.', 'Creative',
   '{isometric,map,hand-drawn,schematic}', '/styles/api/isometric-map.png', '[]', 36,
   $$Create a hand drawn isometric schematic diagram of this street$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('risograph-icons', 'Risograph Icons', 'Transform your ideas into a risograph-inspired icon collection with textured ink and vibrant print colors.', 'Creative',
   '{risograph,icons,print,stipple}', '/styles/api/risograph-icons.png', '[]', 37,
   $$Create a collection of icons representing a theme, they belong together as a single theme. Put them in a 2x2 grid (no lines). The background is pure white. Make the icons as risograph prints. No text. No color distortion. Vibrant and not faded. Stochastic stippling and sand-like noise pattern within color fills. Each icon has a thick black outline.$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}'),

  ('metallic-logo', 'Metallic Logo', 'Transform your logo into a dark metallic design with dramatic lighting, realistic textures, and depth.', 'Creative',
   '{logo,metallic,dark,brand}', '/styles/api/metallic-logo.png', '[]', 38,
   $$Dark metallic, heavy-lighted logos$$,
   'google/nano-banana-2', '{"replicate":{"model":"nano-banana-2"}}')
on conflict (slug) do nothing;
