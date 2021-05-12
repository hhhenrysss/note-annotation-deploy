const {document, highlight, user, comment} = require("./data-source");
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
    res.json({data: await user.verifyCredential(username, password)});
})

app.post('/api/register', jsonParser, async (req, res) => {
    const {username, password, role} = req.body;
    res.json({data: await user.register({username, password, role})});
})

app.get('/api/pdfs', async (req, res) => {
    return res.json({
        data: await document.getAllDocuments()
    });
});

app.post('/api/pdf/edit', jsonParser, async (req, res) => {
    const {name, id} = req.body;
    return res.json({
        data: await document.modifyDocument(name, id)
    });
});

app.get('/api/highlights', jsonParser, async (req, res) => {
    const {id} = req.query;
    return res.json({
        data: await highlight.getHighlightsByDocumentId(id)
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})