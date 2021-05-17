const dataSource = require("./data-source");
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path')


const app = express()
const jsonParser = bodyParser.json();

const port = process.env.PORT || 3005

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.post('/api/login', jsonParser, async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    res.json({data: await dataSource.user.verifyCredential(username, password)});
})

app.post('/api/register', jsonParser, async (req, res) => {
    const {username, password, role} = req.body;
    res.json({data: await dataSource.user.register({username, password, role})});
})

app.get('/api/pdfs', async (req, res) => {
    const author = req.query.username;
    return res.json({
        data: await dataSource.document.getAllDocuments(author)
    });
});

app.post('/api/pdf/edit', jsonParser, async (req, res) => {
    const {name, id} = req.body;
    return res.json({
        data: await dataSource.document.modifyDocument(name, id)
    });
});

app.post('/api/pdf/create', jsonParser, async (req, res) => {
    return res.json({
        data: await dataSource.document.addDocument(req.body)
    });
});

app.get('/api/highlights', jsonParser, async (req, res) => {
    const {id, username} = req.query;
    return res.json({
        data: await dataSource.document.getAllData(id, username)
    })
});

app.post('/api/highlight/add', jsonParser, async (req, res) => {
    const {highlight, comment, externalDocs} = req.body
    const docs = [];
    for (const d of externalDocs) {
        docs.push(await dataSource.externalDocuments.addExternalDocument(d));
    }
    return res.json({
        data: {
            highlight: await dataSource.highlight.addHighlight(highlight),
            comment: await dataSource.comment.addComment(comment),
            externalDocs: docs
        }
    })
})

app.post('/api/highlight/upvote', jsonParser, async (req, res) => {
    const {id, isCancel} = req.body;
    return res.json({
        data: isCancel ? await dataSource.highlight.cancelUpvoteHighlight(id) : await dataSource.highlight.upvoteHighlight(id)
    })
})

app.post('/api/comment/add', jsonParser, async (req, res) => {
    const {targetId, comment, externalDocs} = req.body
    const docs = [];
    for (const d of externalDocs) {
        docs.push(await dataSource.externalDocuments.addExternalDocument(d));
    }
    return res.json({
        data: {
            comment: await dataSource.comment.addReply(comment, targetId),
            externalDocs: docs
        }
    })
})

app.post('/api/pdf/delete', jsonParser, async (req, res) => {
    const {id} = req.body;
    return res.json({
        data: await dataSource.document.deleteDocument(id)
    })
})

app.post('/api/comment/delete', jsonParser, async (req, res) => {
    const {id} = req.body;
    return res.json({
        data: await dataSource.comment.deleteComment(id)
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})