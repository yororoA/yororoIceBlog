// 首页公告内容（Markdown 格式）
// 你可以自由编辑下面这段字符串，支持基础 Markdown 语法：
// - 标题：以 # 开头
// - **加粗**、_斜体_
// - [链接](https://example.com)
export const homeAnnouncementMarkdown = {
  en: `
# Welcome to yororoIce's Town

> 1. There used to be an issue in guest-mode identity handling and tokens could expire too quickly.
**Fixed**

2. Due to network conditions, POST/GET requests may be slow. When posting a moment, please wait for the page to return or close the editor manually. Do not click upload repeatedly to avoid duplicate uploads.

3. Images uploaded to gallery cannot be deleted from the UI yet (contact the admin by email if needed). Images uploaded to gallery via the "commit to gallery" option in a moment cannot be removed by deleting that moment.

> 4. Fixed plaintext credential transmission during account login.
`,
  zh: `
# Welcome to yororoIce's Town

> 1. 目前后端对于游客模式的识别存在一定问题，使用游客模式进入网站后 token 很快就会失效。
**已修复**

2. 由于网络问题，POST/GET 请求速度较慢。在发布 moment 的 POST 期间请耐心等待页面回退或自主关闭发布页面，请勿连续点击上传按钮以免重复上传。

3. 上传到 gallery 的图片暂不支持删除（若要删除请通过邮箱联系管理员）；发布 moment 时通过勾选 commit 上传到 gallery 的图片，同样无法通过删除 moment 达到移除 gallery 的目的。

> 4. 修复账号登录时账密明文传输的问题。
`,
};

