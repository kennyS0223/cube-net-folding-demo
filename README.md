# 立方体展开图 3D 动态折叠演示

这是一个用于小学数学课堂的 React + Three.js 交互式网页。学生可以选择不同立方体展开图，查看平铺状态，并播放 3D 折叠成立方体的动画。

## 本地启动

```bash
npm install
npm run dev
```

启动后在浏览器打开终端提示的本地地址，通常是：

```text
http://localhost:5173
```

## 项目结构

```text
.
├── index.html
├── package.json
├── README.md
└── src
    ├── App.jsx
    ├── main.jsx
    ├── components
    │   └── FoldScene.jsx
    ├── data
    │   └── nets.js
    └── styles.css
```

## 主要功能

- 5 种展开图：十字型、一字四连型、T 字型、阶梯型、Z 字型
- 6 个面使用不同颜色，并标注 A、B、C、D、E、F
- 支持开始折叠、重播动画、恢复展开
- 支持显示或隐藏面编号
- 支持拖动观察和自动旋转观察
- 右侧讲解面板展示展开图说明、观察提示和折叠步骤
- 纯前端实现，不依赖后端服务
