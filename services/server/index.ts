import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PORT } from '../config';

const app = express();

app.use(cors({
  origin: "*",
  methods: ['GET','POST'],
  credentials: true
}));

app.listen(PORT!, () => {
  console.log(`Server Running on PORT ${PORT}`);
})

