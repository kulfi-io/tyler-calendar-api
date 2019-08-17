import BaseController from "./base-controller";
import { Request, Response } from 'express';

export class CalendarController extends BaseController {
    constructor() {
        super();
    }

    calendarlist = (req: Request, res: Response) => {
        this.googleCalendar.Calendar.calendarList.list()
            .then((result) => {
                return res.status(200).send({ message: 'list', data: result.data });
            })
            .catch((err) => {
                res.status(400).send({ message: err.message });
            });
    }

    getCalendar = (req: Request, res: Response) => {

    }

}

export default new CalendarController();
