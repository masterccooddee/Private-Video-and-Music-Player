import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.TMDB_KEY === undefined);
