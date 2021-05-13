const dataSource = require("./data-source");
const express = require('express')
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');


const app = express()
const jsonParser = bodyParser.json();

const port = 3005

app.get('/', (req, res) => {
    res.send('Hello World!')
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
        data: await dataSource.highlight.getHighlightsByDocumentId(id, username)
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})