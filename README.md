# Pixel Shader Switches

- [像素着色器开关](https://bhu103-data.github.io/pixel-shader-switches/)
- [纽约与阿拉斯加 · 像素地景](https://bhu103-data.github.io/pixel-shader-switches/usa/)

## 美国版

`usa/index.html` 是账户和访客入口，`usa/scene.html` 是全屏地景。选择「以访客身份进入」即可浏览。纽约有 7 号线、自由女神像和元素怪兽，阿拉斯加有驼鹿、棕熊、极光及飘雪。两处河流都能看到小鱼跃出水面。

这是静态网站，无需安装依赖或构建。在仓库根目录运行 `python3 -m http.server 8000`，再访问 `http://localhost:8000/usa/`。GitHub Pages 从默认分支根目录部署时会直接提供 `/usa/`。

### 启用邮箱与短信验证码

账户入口使用 Supabase Auth。启用前，访客入口可正常使用。

1. 在 `usa/auth-config.js` 中填写 Supabase 项目 URL 和浏览器可用的 publishable key（`sb_publishable_...`）。私钥留在认证服务后台。
2. 在 Supabase Auth 启用 Email 和 Phone。邮件模板使用 `{{ .Token }}` 发验证码，手机号验证需要配置短信提供商。上线前配置邮件发送服务和正式站点 URL，并实测实际投递。
3. 用邮箱和手机号分别验证注册和已有账户登录。注册允许创建账户，登录仅允许已有账户，进入后可通过右上角「账户」退出。
