var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin 登陆页
router.get('/', checkNotLogin, function (req, res, next) {
    res.render('signin');
});

// POST /signin 登录页
router.post('/', checkNotLogin, function (req, res, next) {
    var name = req.fields.name;
    var password = req.fields.password;
    UserModel.getUserByName(name)
        .then(function (user) {
            if (!user) {
                req.flash('error', '用户名不存在');
                res.redirect('back');
            }
            if (sha1(password) !== user.password) {
                req.flash('error', '密码错误');
                res.redirect('back');
            }
            req.flash('success', '登陆成功');
            //   用户信息写入 session
            delete user.password;
            req.session.user = user;
            //    跳到主页
            res.redirect('/posts');
        })
        .catch(next);
});

module.exports = router;
