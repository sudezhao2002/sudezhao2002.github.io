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

1. 新建名为 `你的用户名.github.io` 的公开仓库。
2. 将本目录文件提交并推送到仓库的 `main` 分支。
3. 在仓库 **Settings → Pages** 中选择 **Deploy from a branch**，分支选择 `main`，目录选择 `/ (root)`。
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

页面仅通过 Google Fonts 加载字体；如果你希望完全离线，可删除 `styles.css` 第一行的 `@import`，页面会自动使用系统字体。
