import express, {Application, Request, Response} from 'express';
import dotenv from 'dotenv'

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome')
})

app.listen(port, () => {
    console.log("Listen on port 8000");
})