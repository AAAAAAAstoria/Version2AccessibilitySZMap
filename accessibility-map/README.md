# 📍 深圳城市无障碍地图

基于无障碍环境建设实地测评数据构建的交互式地图网站,覆盖 **18 家医院 + 2 所大学 + 95 家酒店 + 5 个商场 + 10 个公园,共 130 个测评点**。
地图直观呈现各点位分布,点击图钉即可查看该地点的无障碍情况、现场照片、真实评价与系统自动生成的「无障碍表现」评分。

![类别](https://img.shields.io/badge/医院-18-e2554d) ![类别](https://img.shields.io/badge/大学-2-2f80ed) ![类别](https://img.shields.io/badge/酒店-95-9333ea) ![类别](https://img.shields.io/badge/商场-5-ea8a0c) ![类别](https://img.shields.io/badge/公园-10-16a34a) ![底图](https://img.shields.io/badge/底图-腾讯地图GL_JS-0f766e)

---

## ✨ 功能一览

| 功能 | 说明 |
|---|---|
| 全屏地图 | 腾讯地图 GL JS 底图,GCJ-02 坐标 |
| 分类图钉 | 医院(红)/ 大学(蓝)/ 酒店(紫)/ 商场(橙)/ 公园(绿),默认全部显示 |
| 缩放控制 | 左上角 +/− 按钮,支持触控板/滚轮缩放 |
| 筛选 | 按「类别分布」「无障碍表现(优秀/良好/一般/待改善)」「照片情况」组合筛选 |
| 搜索 | 按地点名称/地址模糊搜索,回车直达 |
| 详情弹窗 | 无障碍情况(全部测评字段)、相关照片、真实评价、系统评分 |
| 图例 | 右下角图例说明颜色对应关系 |

## 📁 目录结构

```
accessibility-map/
├── index.html      # 页面入口 + 地图 SDK 双模式加载
├── css/style.css   # 全部样式(浅色主题)
├── js/data.js      # 测评点位数据(由 Excel 自动生成)
├── js/app.js       # 地图与交互逻辑
└── README.md
```

## 🚀 部署到 GitHub Pages

### 第一步:申请腾讯地图 Key(必需)

直接部署后地图会空白——预览环境使用的代理密钥在你的站点不可用,需要申请自己的 Key:

1. 打开 [腾讯位置服务开放平台](https://lbs.qq.com),注册/登录;
2. 进入 **控制台 → 应用管理 → 我的应用**,点击 **创建应用**;
3. 在应用下 **添加 Key**,产品选择 **JavaScript API GL**;
4. 在该 Key 的 **域名白名单** 中填入你的部署域名,例如 `你的用户名.github.io`(本地调试可加 `localhost`);
5. 复制生成的 Key。

### 第二步:替换占位符

打开 `index.html`,找到顶部:

```js
window.TMAP_KEY = "Please apply for your own key at the Tencent Location Service Open Platform and replace this placeholder";
```

将整段占位文字替换为你申请到的 Key(保持引号)。

### 第三步:上传 GitHub 并开启 Pages

```bash
git init
git add .
git commit -m "深圳城市无障碍地图"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

然后到仓库 **Settings → Pages → Build and deployment**,Source 选 `Deploy from a branch`,Branch 选 `main` / `(root)`,保存。
约 1 分钟后访问 `https://你的用户名.github.io/仓库名/` 即可。

> 任何静态托管(GitHub Pages / Vercel / Netlify / Cloudflare Pages)都适用,无需后端。

## 🛠 本地预览

```bash
cd accessibility-map
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> 本地直接双击 `index.html` 也能打开,但推荐用上面的方式。

## 📊 数据说明

- 数据来源:《深圳市医院无障碍环境建设调研》(18 家)、《大学无障碍环境建设测评》(2 所);
- **无障碍表现评分**:由系统依据各测评字段的肯定/否定/部分符合程度自动加权生成(0–100 分),≥85 优秀、70–84 良好、55–69 一般、<55 待改善,仅供直观参考;
- **照片**:仅展示测评表中带可访问链接的照片;表中仅为本地文件名的照片无法直接展示,已按规则弃用;
- 弹窗不展示「测评小组成员」及其合影;
- 坐标为 GCJ-02(火星坐标系),来源于腾讯地图/高德 POI 检索。个别点位如需微调,直接修改 `js/data.js` 中对应条目的 `lat` / `lng` 即可。

## ⚖️ 合规说明

- 底图仅使用腾讯地图(国内合规图源),坐标为 GCJ-02 国家测绘标准;
- 页面展示的均为公共机构公开信息,不含任何个人位置数据;
- 请勿将腾讯地图 Key 分享给他人;商用场景请将 Key 鉴权放在服务端代理。
