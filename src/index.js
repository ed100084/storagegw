require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();

// 檢查必要的環境變數
const requiredEnvVars = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('錯誤：缺少必要的環境變數：', missingEnvVars.join(', '));
  process.exit(1);
}

// GitHub 認證設定
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('GitHub 認證成功：', profile.username);
    return done(null, profile);
  }
));

// 序列化和反序列化使用者
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// 中間件設定
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('錯誤：', err);
  res.status(500).json({ error: '內部伺服器錯誤' });
});

// 路由
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('認證回調成功');
    res.redirect('/');
  }
);

// 受保護的路由
app.get('/api/storage', (req, res) => {
  if (!req.isAuthenticated()) {
    console.log('未授權的存取嘗試');
    return res.status(401).json({ error: '未授權' });
  }
  res.json({ message: '存儲服務已就緒' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行在端口 ${PORT}`);
  console.log(`GitHub 認證回調 URL: ${process.env.GITHUB_CALLBACK_URL}`);
}); 