# 嘀客 Demo（DeekeScript Pro）

对接 `Desktop/app` 后端（`/api/v1/app/*`）的自动化 Demo：开通检测、支付宝支付、话术配置、权限引导、简单 RPA 骨架。

## 使用前

1. 改 `common/config.js`
   - 生产域名已固定：`apiHost = https://app.deeke.cn`，接口 Base 为 `https://app.deeke.cn/api/v1`
   - `toolCode`：必须是后台已发布的工具编号（如 `D0001`）
2. 用 DeekeScript Pro 打开本目录，同步到手机后调试（本仓库按你的要求未做实机联调）

## 功能地图

| 页面 | 作用 |
|------|------|
| 首页 | 开通状态、目标 App 适配卡、开始运行（先检测支付/适配版本/无障碍/悬浮窗） |
| 话术 | 私信 / 评论总开关 + 列表启停 |
| 设置 | 点赞 / 评论 / 私信等运行开关与配置 |
| 开通 | 月卡/年卡等套餐、优惠码预览/下单、支付宝调起、扫码支付、激活码 |
| 适配下载 | 目标 App 支持版本、本机状态、官方/版本外链下载 |
| 我的 | 省电/高耗电、无障碍教程、**检查/下载更新**、设备号 |

## 接口（已有，无需补后端）

- `GET /app/tools/{code}/pricing`（可选 `?coupon=` 预览券后价）
- `GET /apps/{code}`（含 `targetApp` 适配说明与外部下载链接）
- `POST /app/activation/check`
- `POST /app/orders`（`channel`: `app` / `qr` / `h5`，可选 `coupon`）
- `GET /app/orders/{orderNo}`
- `POST /app/activate`
- `GET /app/update/check`、`GET /app/update/download/{code}/{versionCode?}`

后端扫码与支付宝能力已在 `app/docs/APP_API.md` 说明；本 Demo 的扫码展示参考了旧 PHP 项目的当面付二维码用法。
