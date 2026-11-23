# 个人学术主页框架

这是一个无需构建工具的静态个人学术主页，可直接部署到 GitHub Pages。信息结构参考了常见学术主页的组织方式，包含：

- 个人简介与研究方向
- 最新动态
- 代表性论文与分类筛选
- 教育 / 研究经历
- 奖励与荣誉
- 学术服务与联系方式
- 中英切换、深浅色模式、响应式导航

## 修改内容

主要内容都在 `index.html` 中。建议先全局搜索以下占位词并替换：

- `你的姓名` / `Your Name`
- `某某大学` / `Your University`
- `your.name@example.edu`
- `data-placeholder-link`（Google Scholar、ORCID、GitHub、论文等真实链接）
- 论文标题、作者、会议与新闻内容

个人照片请替换 `assets/profile-placeholder.svg`，也可以改成 JPG / PNG 后同步修改 `index.html` 中的图片路径。

统计数字（论文、引用、项目）位于 `index.html` 的 `.quick-facts` 区块。

英文文案位于 `script.js` 的 `translations.en` 对象中。

## 本地预览

推荐在本目录运行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署到 GitHub Pages

推送到 `main` 后，GitHub Actions 会自动运行 `runBeforeUpdate.sh` 同步 CSS 版本号，然后发布网站，无需在本地手动执行。版本号修改仅用于发布产物，不会额外提交回仓库。

如果需要本地预览最新版本号，可在项目目录运行：

```bash
bash runBeforeUpdate.sh
```

脚本适用于 Linux、macOS 和 Windows 的 Git Bash，无需 Python。它会自动计算 CSS 文件 SHA256 的前 12 位，并同步更新 `index.html` 和 `en.html` 中的样式版本号；内容未变时不会重复写入，成功后打印 `css同步成功`。将 CSS 和更新后的 HTML 一起提交推送即可，浏览器会请求新的样式地址，避免沿用旧缓存。

1. 新建名为 `你的用户名.github.io` 的公开仓库。
2. 将本目录文件提交并推送到仓库的 `main` 分支。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**（仅需设置一次）。
4. 稍等片刻后访问 `https://你的用户名.github.io/`。

如果部署到普通项目仓库（例如 `homepage`），本项目使用的都是相对路径，同样可以直接运行在 `https://你的用户名.github.io/homepage/` 下。

## 文件结构

```text
.
├── index.html
├── styles.css
├── script.js
├── .nojekyll
└── assets/
    ├── favicon.svg
    └── profile-placeholder.svg
```

页面使用的 Noto Sans SC 和 Noto Serif SC 字体已保存在 `assets/fonts/`，入口为 `assets/fonts/fonts.css`，原始授权文件也保存在该目录中。浏览器按页面用字加载需要的字体分片，无需访问 Google 字体服务；字体异步加载期间先使用系统字体，不阻塞正文和图片显示。

## 论文图片

列表缩略图保存在 `assets/thumbnails/`，宽度 800 像素。中清备用图保存在 `assets/previews/`，最大宽度 1600 像素，原图小于该尺寸时不放大。两者均由 `assets/` 下的原始 PNG 生成，使用 WebP 格式、质量参数 94。

中英文页面的 `.publication-image-link` 中，`href` 是 COS 原图地址，`data-preview-src` 是中清备用图地址，内部 `<img>` 的 `src` 是列表缩略图地址。缩略图加载完后，页面自动预载 COS 原图；COS 报错或等待超过 6 秒时预载备用图。点开图片后优先显示已加载的原图，否则显示备用图，原图稍后加载成功时自动替换，保留当前缩放和拖动位置。
