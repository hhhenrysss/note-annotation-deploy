require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.itgt1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(console.error);

const User = mongoose.model('User', new mongoose.Schema({
    username: mongoose.Schema.Types.String,
    password: mongoose.Schema.Types.String,
    role: mongoose.Schema.Types.String,
}))

const Comment = mongoose.model('Comment', new mongoose.Schema({
    id: mongoose.Schema.Types.String,
    content: mongoose.Schema.Types.String,
    title: mongoose.Schema.Types.String,
    type: mongoose.Schema.Types.String,
    replies: [mongoose.Schema.Types.String],
    author: mongoose.Schema.Types.String,
    linkedDocuments: [mongoose.Schema.Types.String],
}))

const Highlight = mongoose.model('Highlight', new mongoose.Schema({
    position: mongoose.Schema.Types.Mixed,
    id: mongoose.Schema.Types.String,
    content: {text: mongoose.Schema.Types.String,},
    documentId: mongoose.Schema.Types.String,
    commentId: mongoose.Schema.Types.String,
    upvotes: mongoose.Schema.Types.Number,
    access: mongoose.Schema.Types.String,
}))

const Document = mongoose.model('Document', new mongoose.Schema({
    url: mongoose.Schema.Types.String,
    name: mongoose.Schema.Types.String,
    creationDate: mongoose.Schema.Types.Number,
    author: mongoose.Schema.Types.String,
    id: mongoose.Schema.Types.String,
    lastUpdatedDate: mongoose.Schema.Types.Number,
}))

const ExternalLink = mongoose.model('ExternalLink', new mongoose.Schema({
    url: mongoose.Schema.Types.String,
    name: mongoose.Schema.Types.String,
    creationDate: mongoose.Schema.Types.Number,
    author: mongoose.Schema.Types.String,
    id: mongoose.Schema.Types.String,
    lastUpdatedDate: mongoose.Schema.Types.Number,
}))

module.exports.user = {
    async verifyCredential(username, password) {
        const user = await User.findOne({username}).exec()
        if (!user) {
            return false;
        }
        return user.password === password
    },
    async register(rawUser) {
        const user = new User(rawUser)
        await user.save()
    }
}

module.exports.document = {
    async getAllDocuments() {
        return Document.find({}).exec()
    },
    async addDocument(rawDoc) {
        const doc = new Document(rawDoc)
        await doc.save()
    },
    async modifyDocument(name, id) {
        return Document.findOneAndUpdate({id}, {name}, {new: true}).exec()
    }
}

module.exports.comment = {
    async addComment(rawComment) {
        const comment = new Comment(rawComment)
        await comment.save()
    },
    async addReply(rawComment, targetId) {
        const parent = await Comment.findOne({id: targetId})
        parent.replies.push(rawComment.id)
        await parent.save().exec()
        const comment = new Comment(rawComment)
        await comment.save()
    }
}

module.exports.highlight = {
    async getHighlightsByDocumentId(id) {
        const highlights = await Highlight.find({documentId: id}).exec();
        const comments = {};
        const users = {};
        const commentsIdQueue = [];
        for (const highlight of highlights) {
            commentsIdQueue.push(highlight.commentId);
        }
        while (commentsIdQueue.length) {
            const commentId = commentsIdQueue.pop();
            const comment = await Comment.findOne({id: commentId}).exec();
            comments[commentId] = comment
            for (const repliesId of comment.replies) {
                if (!(repliesId in comments)) {
                    commentsIdQueue.push(repliesId);
                }
            }
        }
        for (const comment of Object.values(comments)) {
            if (comment.author in users) {
                continue;
            }
            const user = await User.findOne({username: comment.author}).exec();
            users[user.username] = user.role
        }
        return {highlights, comments, users}
    },
    async addHighlight(rawHighlight) {
        const highlight = new Highlight(rawHighlight)
        await highlight.save()
    },
    async upvoteHighlight(id) {
        const highlight = await Highlight.findOne({id}).exec()
        highlight.upvotes += 1
        await highlight.save()
    },
    async cancelUpvoteHighlight(id) {
        const highlight = await Highlight.findOne({id}).exec()
        highlight.upvotes -= 1
        await highlight.save()
    }
}

