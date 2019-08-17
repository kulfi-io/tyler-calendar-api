import * as moment from 'moment';
import BaseController from './base-controller';
import { EVENT, TIMEZONE } from 'src/models/enums';
import { ICalEvent, IEvent } from 'src/models/interfaces';
import { Request, Response } from 'express';
import { sender } from '../config/config.json';

export class EventController extends BaseController {
    private firstDate: moment.Moment;

    constructor() {
        super();
        this.firstDate = moment(1, "DD");
    }

    events = (req: Request, res: Response) => {

        this.googleCalendar.Calendar.events.list({
            calendarId: 'primary',
            timeMin: (this.firstDate.toISOString()),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        })
            .then((result) => {
                res.status(200).send({ message: 'events', data: result.data })
            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });
    }

    event = (req: Request, res: Response) => {

    }

    remove = (req: Request, res: Response) => {

    }

    add = (req: Request, res: Response) => {

        if (!req.body || !req.body.summary || !req.body.location
            || !req.body.description || !req.body.start || req.body.end
            || !req.body.email
        ) {
            res.status(400).send({ message: EVENT.MISSING_REQUIRED_ITEMS })
        }

        const _event: IEvent = {
            summary: this.decrypt(req.body.summary),
            location: this.decrypt(req.body.location),
            description: this.decrypt(req.body.description),
            start: this.decrypt(req.body.start),
            end: this.decrypt(req.body.end),
            email: this.decrypt(req.body.email)
        };

        const _calEvent: ICalEvent = {
            summary: _event.summary,
            location: _event.location,
            description: _event.description,
            start: {
                dateTime: moment(_event.start).toISOString(),
                timeZone: TIMEZONE.WEST
            },
            end: {
                dateTime: moment(_event.end).toISOString(),
                timeZone: TIMEZONE.WEST
            },
            recurrence: [],
            attendees: [
                { email: _event.email },
                { email: sender }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 }
                ]
            }
        }


        this.googleCalendar.Calendar.events.insert({
            calendarId: "primary",
            requestBody: _calEvent
        })
            .then((result) => {
                if(result.data.id) 
                    res.status(200).send({ message: 'created', data: this.encrypt(result.data.id) })
                else
                    res.status(400).send({message: EVENT.FAILED})
            })
            .catch((err: Error) => {
                return res.status(400).send({ message: err.message });
            });
    }
}

export default new EventController();