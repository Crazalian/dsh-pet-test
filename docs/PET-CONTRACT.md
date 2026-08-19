# Pet 契约（manifest 规范）

dsh-pet 插件遵循 **Codex / hatch-pet** 宠物契约。一只宠物 = **一个目录** + **`pet.json` manifest** + **一张图集（spritesheet）**。除此之外无需改任何宿主或客户端代码。

## 目录结构

```
~/.codex/pets/<petId>/
├── pet.json            # 清单（必须）
└── spritesheet.webp    # 图集（路径由 pet.json 的 spritesheetPath 声明）
```

dsh-pet 在**宿主启动时**扫描 `~/.codex/pets/` 下的子目录，把每个含 `pet.json` 的目录注册为一只宠物。新增/修改后需重启 `dsh web`。

## manifest 字段

```jsonc
{
  "id": "paimon",                     // 必填，小写 kebab 唯一 id（[a-z0-9][a-z0-9-]*）
  "displayName": "派蒙",               // 必填，显示在设置选择器与悬浮面板
  "description": "...",                // 选填，一句话描述
  "spritesheetPath": "spritesheet.webp", // 必填，图集相对路径（安全字符集，禁 ../、反斜杠）
  "cell": { "width": 192, "height": 208 }, // 选填，格子尺寸；默认 192x208
  "columns": 8,                        // 选填，每行列数；默认 8
  "frames": [6,8,8,4,5,8,6,6,6],       // 选填，9 行各自的用列数；默认 [6,8,8,4,5,8,6,6,6]
  "tracks": {                          // 选填，逐轨节奏覆盖
    "idle": { "durations": [400,400,500,400,400,500] }
  },
  "remarks": {                         // 选填，专属妙语（摸头/喂食等事件台词）
    "pet": "摸摸头～",
    "feed": ["小鱼干真香", "再来一条～"]
  }
}
```

### 字段边界（来自源码 `registry.ts`）

| 字段 | 约束 | 默认值 |
|---|---|---|
| `id` | `/^[a-z0-9][a-z0-9-]*$/` | 无（必填） |
| `displayName` | 去空白非空，最长 80 | 回退为 `id` |
| `spritesheetPath` | 安全相对路径（无 `..`、无 `\`、段字符集 `[A-Za-z0-9._-]`） | `spritesheet.webp` |
| `cell.width/height` | 整数 1..2048 | 192 / 208 |
| `columns` | 整数 1..32 | 8 |
| `frames[i]` | 整数 1..columns，共 9 项 | `[6,8,8,4,5,8,6,6,6]` |
| `tracks.<anim>.durations` | 正数数组，按该行帧数循环补足/截断 | hatch-pet 默认节奏表 |
| `tracks.<anim>.loop` | 布尔 | 见默认表；`jumping`/`failed` 默认 false |
| `tracks.<anim>.fallback` | 在 9 态之一中取值 | `jumping`/`failed` → `idle` |

## 图集行序（9 行，固定）

图集是 **`columns` 列 × 9 行** 网格。非循环/少帧的行，剩余格子保持全透明即可。

| 行号 | 动画 | 默认帧数 | 默认帧时长(ms) | 循环 |
|---|---|---|---|---|
| 0 | `idle` | 6 | 280,110,110,140,140,320 | ✅ |
| 1 | `running-right` | 8 | 120×7,220 | ✅ |
| 2 | `running-left` | 8 | 120×7,220 | ✅ |
| 3 | `waving` | 4 | 140,140,140,280 | ✅ |
| 4 | `jumping` | 5 | 140×4,280 | ❌ → `idle` |
| 5 | `failed` | 8 | 140×7,240 | ❌ → `idle` |
| 6 | `waiting` | 6 | 150×5,260 | ✅ |
| 7 | `running` | 6 | 120×5,220 | ✅ |
| 8 | `review` | 6 | 150×5,280 | ✅ |

**注意**：运行 `dsh` 时，精灵按 `tracks[动画].frames`（默认 `[0..n-1]`）顺序播放对应行的列。`jumping`/`failed` 是非循环轨：停在最后一帧后回落到 `idle`。

## 校验

本项目用 dsh-pet 的真实注册表代码校验所有宠物，见 `scripts/validate-pets.js`：

```bash
node scripts/validate-pets.js
```

期望输出 `warnings=[]` 且列出 6 只宠物（含内置 whale-girl）。

## 制作新宠物

1. **现成包**：复制任意 Codex 宠物目录到 `~/.codex/pets/<id>/`（见 [README](../README.md) 的来源仓库）。
2. **程序化生成**：用 [`route-b.js`](../route-b.js) 从一张透明立绘生成 9 态图集 + `pet.json`。
3. **手工绘制**：按上表拼一张 `columns×9` 图集，写 `pet.json`。

任何方式都不需要改 dsh-pet 插件本身。
