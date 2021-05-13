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
    access: mongoose.Schema.Types.String,
    replies: [mongoose.Schema.Types.String],
    author: mongoose.Schema.Types.String,
    linkedDocuments: [mongoose.Schema.Types.String],
}))

const Highlight = mongoose.model('Highlight', new mongoose.Schema({
    position: mongoose.Schema.Types.Mixed,
    id: mongoose.Schema.Types.String,
    selectedText: {text: mongoose.Schema.Types.String,},
    documentId: mongoose.Schema.Types.String,
    author: mongoose.Schema.Types.String,
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
    access: mongoose.Schema.Types.String,
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
        if (!user || user.password !== password) {
            return null;
        }
        return {username: user.username, role: user.role}
    },
    async register(rawUser) {
        const user = new User(rawUser)
        await user.save()
        return {username: user.username, role: user.role}
    }
}

module.exports.document = {
    async getAllDocuments(author) {
        return Document.find({'$or': [{author}, {access: 'public'}]}).exec()
    },
    async addDocument(rawDoc) {
        const doc = new Document(rawDoc)
        await doc.save()
        return rawDoc
    },
    async modifyDocument(name, id) {
        return Document.findOneAndUpdate({id}, {name}, {new: true}).exec()
    }
}

module.exports.comment = {
    async addComment(rawComment) {
        const comment = new Comment(rawComment)
        await comment.save()
        return rawComment
    },
    async addReply(rawComment, targetId) {
        const parent = await Comment.findOne({id: targetId})
        parent.replies.push(rawComment.id)
        await parent.save().exec()
        const comment = new Comment(rawComment)
        await comment.save()
    }
}

module.exports.externalDocuments = {
    async addExternalDocument(rawDoc) {
        const doc = new ExternalLink(rawDoc);
        await doc.save();
        return rawDoc
    }
}

module.exports.highlight = {
    async getHighlightsByDocumentId(id, currentUsername) {
        const highlights = await Highlight.find({
            '$or': [{documentId: id, access: 'public'}, {
                documentId: id,
                author: currentUsername
            }]
        }).exec();
        const comments = {};
        const users = {};
        const linkedDocuments = {};
        const linkedExternalResources = {};
        const commentsIdQueue = [];
        for (const highlight of highlights) {
            commentsIdQueue.push(highlight.commentId);
        }
        while (commentsIdQueue.length) {
            const commentIds = [...commentsIdQueue];
            commentsIdQueue.length = 0
            const gatheredComments = await Comment.find({id: {'$in': commentIds}}).exec();
            for (const c of gatheredComments) {
                comments[c.id] = c;
            }
            for (const c of gatheredComments) {
                for (const repliesId of c.replies) {
                    if (!(repliesId in comments)) {
                        commentsIdQueue.push(repliesId);
                    }
                }
                const documentIds = c.linkedDocuments.filter(l => !((l in linkedDocuments) && (l in linkedExternalResources)))
                const gatheredDocuments = await Document.find({id: {'$in': documentIds}}).exec();
                const gatheredExternalLinks = await ExternalLink.find({id: {'$in': documentIds}}).exec();
                for (const d of gatheredDocuments) {
                    if (d.id in linkedDocuments) {
                        continue;
                    }
                    linkedDocuments[d.id] = d;
                }
                for (const e of gatheredExternalLinks) {
                    if (e.id in linkedExternalResources) {
                        continue;
                    }
                    linkedExternalResources[e.id] = e;
                }
            }
        }
        const authorToGather = new Set()
        for (const comment of Object.values(comments)) {
            if (comment.author in users) {
                continue;
            }
            authorToGather.add(comment.author)
        }
        const gatheredUsers = await User.find({username: {$in: [...authorToGather]}}).exec();
        for (const u of gatheredUsers) {
            users[u.username] = u;
        }
        return {highlights, comments, users, linkedDocuments, linkedExternalResources}
    },
    async addHighlight(rawHighlight) {
        const highlight = new Highlight(rawHighlight)
        await highlight.save()
        return rawHighlight
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

