# PanelForge

<div align="center">
  <img src="./doc/logo.png?v=2" width="180" alt="PanelForge logo" />

  <p><strong>故事创意 → 多智能体协作 → 漫剧视频输出</strong></p>
  <p>基于 LangGraph 多智能体编排的 AI 漫剧生成平台</p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+" />
    <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=111827" alt="React 18" />
    <img src="https://img.shields.io/badge/LangGraph-Orchestration-6D28D9?style=flat-square" alt="LangGraph" />
  </p>

  <p>
    <a href="#快速开始">快速开始</a> ·
    <a href="#功能特性">功能特性</a> ·
    <a href="#技术栈">技术栈</a> ·
    <a href="#项目结构">项目结构</a>
  </p>
</div>

PanelForge 将故事创意转化为完整的 **规划、角色/分镜生成、视频合成** 流水线，并在无限画布上展示整个过程。

> [!WARNING]
> 这是一个学习项目，专注于多阶段编排、可恢复执行、实时进度和全栈协作。

## 功能特性

- **多智能体流水线** — Outline（大纲）、Plan（规划）、Render（渲染）、Compose（合成）、Critic（审查）五大智能体协作完成全流程
- **WebSocket 实时推送** — 前端实时展示生成进度、思考链和阶段状态
- **可恢复 / 可取消 / 可反馈** — 支持中断恢复、手动确认、YOLO 自动模式
- **无限画布** — 基于 tldraw 的画布界面，可视化管理角色、分镜和视频
- **质量审查闭环** — Critic 智能体对角色图和分镜图进行多维度评分，不达标自动重生成
- **IP 宇宙系统** — 跨项目共享世界观、角色库和风格规则
- **视频合成** — 支持文生视频和图生视频，自动拼接为完整漫剧
- **环境变量管理** — 前端可视化配置面板，支持在线修改和测试连接

## 预览

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./doc/screenshot-home.png" alt="PanelForge 首页" />
      <br />
      <sub><strong>首页 · 故事输入与风格选择</strong></sub>
    </td>
    <td align="center" width="50%">
      <img src="./doc/screenshot-canvas.png" alt="PanelForge 画布" />
      <br />
      <sub><strong>画布 · 角色、分镜与生成流程</strong></sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="./doc/screenshot-config.png" alt="PanelForge 配置" />
      <br />
      <sub><strong>配置面板 · 在线管理模型与服务</strong></sub>
    </td>
  </tr>
</table>

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + DaisyUI + tldraw |
| 后端 | FastAPI + SQLModel + LangGraph + Alembic |
| 存储 | PostgreSQL + Redis + 本地 `/static` 文件 |
| AI 服务 | Anthropic Claude / OpenAI 兼容接口 / Agnes AI |
| 视频 | ffmpeg (imageio-ffmpeg) + 多视频源 API |

## 快速开始

### Docker 部署

```bash
cp backend/.env.example backend/.env
# 编辑 .env 填入 API 密钥
docker-compose up -d
```

- 前端: http://localhost:15173
- API 文档: http://localhost:18765/docs

### 本地开发

```bash
# 后端
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 18765

# 前端
cd frontend
pnpm install
pnpm dev
```

### 环境变量

复制 `backend/.env.example` 为 `backend/.env`，主要配置项：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `TEXT_PROVIDER` | 文本服务：`anthropic` / `openai` / `fake` |
| `IMAGE_PROVIDER` | 图像服务：`openai` / `fake` |
| `VIDEO_PROVIDER` | 视频服务：`openai` / `doubao` / `fake` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 |
| `CRITIQUE_ENABLED` | 是否启用质量审查闭环 |

## 项目结构

```
PanelForge/
├── backend/
│   ├── app/
│   │   ├── agents/          # 多智能体（outline/plan/render/compose/critic）
│   │   ├── services/        # 业务服务（LLM/图像/视频/合并/审查）
│   │   ├── models/          # 数据模型
│   │   ├── api/             # API 路由
│   │   └── config.py        # 配置管理
│   └── alembic/             # 数据库迁移
├── frontend/
│   ├── app/
│   │   ├── pages/           # 页面组件（首页/项目/宇宙）
│   │   ├── components/      # UI 组件（画布/聊天/布局/面板）
│   │   ├── stores/          # 状态管理（Zustand）
│   │   ├── services/        # API 客户端
│   │   └── styles/          # 全局样式与设计令牌
│   └── tailwind.config.ts   # Tailwind + DaisyUI 主题配置
└── doc/                     # 文档与截图
```

## 常用命令

```bash
# 后端测试
cd backend
uv run pytest
uv run ruff check app tests

# 前端测试与构建
cd frontend
pnpm test
pnpm build
```

## 许可证

MIT
