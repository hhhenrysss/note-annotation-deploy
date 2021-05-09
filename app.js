const {verifyCredential} = require("./data-source");
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
    res.json({data: await verifyCredential(username, password)});
})

app.get('/api/pdf', async (req, res) => {
    return res.json({
        data: {
            url: 'https://arxiv.org/pdf/1708.08021.pdf',
            name: 'Test Doc',
            creationDate: Date.now(),
            author: 'John Doe',
            id: `document-${uuidv4().toString()}`,
            lastUpdatedDate: null,
        }
    });
});

app.post('/api/pdf/edit', jsonParser, async (req, res) => {
    const name = req.body.name;
    return res.json({
        data: {
            url: 'https://arxiv.org/pdf/1708.08021.pdf',
            name,
            creationDate: Date.now(),
            author: 'John Doe',
            id: `document-${uuidv4().toString()}`,
            lastUpdatedDate: Date.now(),
        }
    });
});

app.get('/api/comments', async (req, res) => {

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})