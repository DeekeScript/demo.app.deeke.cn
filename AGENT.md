# 本项目：按 DeekeScript Pro 约定编写

规格仓库：

- 国内镜像（优先）：https://gitee.com/DeekeScript/DeekeScriptV2Agent.git
- GitHub：https://github.com/DeekeScript/DeekeScriptV2Agent.git

所有方法或对象都要符合该仓库约定，不要凭空创造。

## 第一步（必做，禁止跳过）

**禁止**用 WebFetch、curl、浏览器去 GitHub / Gitee **逐条**拉 `AGENTS.md`、`INDEX.md` 或其它 md。一次任务会打几十个 HTTP，又慢又容易超时。

编写或修改任何代码前，必须先把规格仓库**整份弄到本机**，再读本地文件。落盘目录：`.deeke/DeekeScriptV2Agent/`（已 gitignore，不要提交）。具体命令自己选，只遵守下面规则：

1. **只使用 Gitee 与 GitHub**，不用第三方代理。Gitee 失败立刻改试 GitHub，不要停在超时上，也不要改成逐条拉取。
2. 本地已有该目录则先更新；没有则整仓取下。有 git 就 clone / pull；没有 git，或 git 失败，就下载 `main` 分支压缩包再解压。
3. 新 clone 成功后把 `origin` 指回 Gitee，后续更新走国内源。
4. zip 根目录名不固定，以包内 `AGENTS.md` 所在目录为准，整理到 `.deeke/DeekeScriptV2Agent/`。
5. 两个源都失败则停下来让用户给本机路径，不要凭记忆发明 API 继续写代码。

之后只用 Read / Grep 打开该目录下的文件。`tools/deeke-device.sh` 也从这份本地副本复制或直接调用，不要再从远端单文件下载。

## 怎么读

1. 先读完本地规格仓库根目录 `AGENTS.md`（注意文件名多一个 S）。
2. 再读 `INDEX.md`，按当前任务只打开需要的篇。
3. 硬规则全文：`00-core/constraints.md`；落盘前自检：`04-cheatsheets/donts.md`。
4. 搭工程优先抄 `03-recipes/` 里的最小可运行片段。

## 调试与修复

跑不通时：对照日志与上述约定继续改，不要另起一套写法。