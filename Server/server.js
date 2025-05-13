import express from 'express';
import morgan from 'morgan';
import {init} from './init.js';
import get_all from './get_all_file.js';

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

app.use('/',express.static('../public'));
app.use('/cover',express.static('../public/music_cover'));
app.use('/Music',express.static('../../Music'));
app.use('/Video',express.static('../../Video'));

app.get('/get_all', (req, res) => {
    
    const db_path = 'media.db';
    const output = get_all(db_path);
    res.setHeader('Content-Type', 'application/json');
    res.send(output);
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    });