const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Hello Valheim!');
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});