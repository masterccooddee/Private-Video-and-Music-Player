import express from 'express';
import morgan from 'morgan';
import { init } from './init.js';
import get_all from './get_all_file.js';
import { get_from_type } from './get_all_file.js';

const PORT = 3000;

console.log('Starting server...');
await init()
    .then(() => {
        console.log('\n\nInitialization complete');
    })
    .catch(err => {
        console.error('\n\nError initializing: ' + err);
    });

const app = express();
app.use(morgan('dev'));

app.use('/', express.static('../public'));
app.use('/cover', express.static('../public/music_cover'));
app.use('/Music', express.static('../../Music'));
app.use('/Video', express.static('../../Video'));

app.get('/get_all', async (req, res) => {

    const db_path = 'media.db';

    const type = req.query.type;
    let output;
    if (type === undefined) {
        output = await get_all(db_path);
    }
    else {
        output = await get_from_type(db_path, type);
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(output);
});

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:3000');
});