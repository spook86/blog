var path = require('path');
var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var config = require('config-lite');
var routes = require('./routes');
var pkg = require('./package');
var winston = require('winston');
var expressWinston = require('express-winston');

var app = express();

// 设计模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎 EJS
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// session 中间件
app.use(session({
    name: config.session.key, //设置 cookie 中保存的 session id 字段名称
    secret: config.session.secret,
    cookie: {
        maxAge: config.session.maxAge
    },
    store: new MongoStore({
        url: config.mongodb
    })
}));

// flash 中间件 用来显示通知
app.use(flash());

//处理表单及文件上传的中间件
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),  //上传文件目录
    keepExtensions: true,
}));

//设置模板全局变量
app.locals.blog = {
    title: pkg.name,
    description: pkg.description
};

app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});

//正常请求的日志
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));
// 路由 
routes(app);

//错误请求的日志
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}));

// // 监听端口 启动程序 
// app.listen(config.port, function () {
//     console.log(`${pkg.name} listening on port ${config.port}`)
// });

if (module.parent) {
    module.exports = app;
} else {
    // 监听端口，启动程序
    // app.listen(config.port, function () {
    //     console.log(`${pkg.name} listening on port ${config.port}`);
    // });

    const port = process.env.PORT || config.port;
    app.listen(port, function () {
        console.log(`${pkg.name} listening on port ${port}`);
    });
}

// test