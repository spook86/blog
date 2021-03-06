/**
 * Created by Spook on 2017/4/1.
 */
var config = require('config-lite');
var Mongolass = require('mongolass');
var mongolass = new Mongolass();
mongolass.connect(config.mongodb);

var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');

// 用户模型
exports.User = mongolass.model('User', {
    name: {type: 'string'},
    password: {type: 'string'},
    avatar: {type: 'string'},
    gender: {type: 'string', enum: ['m', 'f', 'x']},
    bio: {type: 'string'}
});
exports.User.index({name: 1}, {unique: true}).exec();   //根据用户名找到用户,用户名全局唯一


// 根据id 生成创建时间 create_at
mongolass.plugin('addCreatedAt', {
    afterFind: function (results) {
        results.forEach(function (item) {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
        })
        return results;
    },
    afterFindOne: function (result) {
        if (result) {
            result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
        }
        return result;
    }

});
//文章模型
exports.Post = mongolass.model('post', {
    author: {type: Mongolass.Types.ObjectId},
    title: {type: 'string'},
    content: {type: 'string'},
    pv: {type: 'number'}
});

exports.Post.index({author: 1, _id: -1}).exec();


//留言模型

exports.Comment = mongolass.model('Comment', {
    author: {type: Mongolass.Types.ObjectId},
    content: {type: 'string'},
    postId: {type: Mongolass.Types.ObjectId}
});
exports.Comment.index({postId: 1, _id: 1}).exec();  //通过文章 ID 获取该文章下的所有留言,按留言创建时间升序
exports.Comment.index({author: 1, _id: 1}).exec();  //通过用户 ID 和留言 id 删除一个留言