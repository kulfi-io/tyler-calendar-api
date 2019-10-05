import {Request, Response} from 'express';
import * as config from '../config/config.json'

export class BaseRoute {

    public responseData(req: Request, res: Response) {
        res.status(200).send({message: `Welcome to ${config.name}`});
    }
}