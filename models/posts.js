/**
 * Created by Spook on 2017/4/5.
 */
var marked = require('marked');
var Post = require('../lib/mongo').Post;

var CommentModel = require('./comments');


//将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
    afterFind: function (posts) {
        return posts.map(function (post) {
            post.content = marked(post.content);
            return post;
        })
    },
    afterFindOne: function (post) {
        if (post) {
            post.content = marked(post.content);
        }
        return post;
    }
});

// 给 post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
    afterFind: function (posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount;
                return post;
            });
        }));
    },
    afterFindOne: function (post) {
        if (post) {
            return CommentModel.getCommentsCount(post._id).then(function (count) {
                post.commentsCount = count;
                return post;
            });
        }
        return post;
    }
});
module.exports = {
    //创建一篇文章
    create: function (post) {
        return Post.create(post).exec();
    },
    //根据文章 ID 获取文章
    getPostById: function getPostById(postId) {
        return Post
            .findOne({_id: postId})
            .populate({path: 'author', model: 'User'})
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec();
    },
    //按创建时间子程序获取所有用户文章或者某个特定用户的所有文章
    getPosts: function (author) {
        var query = {};
        if (author) query.author = author;
        return Post
            .find(query)
            .populate({path: 'author', model: 'User'})
            .sort({_id: -1})
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec();
    },
    incPv: function (postId) {
        return Post
            .update({_id: postId}, {$inc: {pv: 1}})
            .exec();
    },
    //根据用户 ID 和文章 ID 获取一篇原生文章（编辑文章）
    getRawPostById: function (postId) {
        return Post
            .findOne({_id: postId})
            .populate({path: 'author', model: 'User'})
            .exec();
    },
    //通过用户 ID 和文章 ID 更新一篇文章
    updatePostById: function (postId, author, data) {
        return Post.update({author: author, _id: postId}, {$set: data}).exec();
    },
    //通过用户 id 和文章 id 删除一篇文章
    delPostById: function (postId, author) {
        return Post.remove({author: author, _id: postId})
            .exec()
            .then(function (res) {
                // 文章删除后，再删除该文章下的所有留言
                if (res.result.ok && res.result.n > 0) {
                    return CommentModel.delCommentsByPostId(postId);
                }
            });
    }

}
