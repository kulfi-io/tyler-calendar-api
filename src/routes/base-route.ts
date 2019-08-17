import {Request, Response} from 'express';
import * as config from '../config/config.json'

export class BaseRoute {
    public title: string;

    constructor() {
        this.title = `Welcome to ${config.name}`;
    }

    public responseData(req: Request, res: Response, data?: Object) {
        res.locals.BASE_URL = "/";
        // res.locals.title = this.title;
        res.status(200);
        res.send(data);
    }
}