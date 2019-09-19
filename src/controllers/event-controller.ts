import * as moment from 'moment';
import BaseController from './base-controller';
import { EVENT, TIMEZONE } from '../models/enums';
import { ICalEvent, IAttendee, ICalEventResponse, ICalTime } from '../models/interfaces';
import { Request, Response } from 'express';
import { calendar_v3 } from 'googleapis';

export class EventController extends BaseController {
    private firstDate: moment.Moment;

    constructor() {
        super();
        this.firstDate = moment(1, "DD");
    }

    private mapCalendarResponse = (item: calendar_v3.Schema$Event): ICalEventResponse => {

        const _item: ICalEventResponse = {
            id: item.id,
            summary: item.summary,
            location: item.location,
            start: <ICalTime>item.start,
            end: <ICalTime>item.end,
            attendees: <IAttendee[]>item.attendees
        }

        return _item;
    }

    private encryptResponse = (item: ICalEventResponse): ICalEventResponse => {
        item.id = item.id ? this.encrypt(item.id) : undefined;
        item.summary = item.summary ? this.encrypt(item.summary) : undefined;
        item.location = item.location ? this.encrypt(item.location) : undefined;
        item.description = item.description ? this.encrypt(item.description) : undefined;

        const _start = item.start ? item.start : undefined;
        const _end = item.end ? item.end : undefined;
        const _attendes = item.attendees ? item.attendees : undefined;

        if (_start) {
            _start.dateTime = this.encrypt(_start.dateTime);
            _start.timeZone = this.encrypt(_start.timeZone);

            item.start = _start;
        }

        if (_end) {
            _end.dateTime = this.encrypt(_end.dateTime);
            _end.timeZone = this.encrypt(_end.timeZone);

            item.end = _end;
        }

        if (_attendes) {

            _attendes.forEach((attendee: IAttendee) => {
                attendee.responseStatus = attendee.responseStatus ? this.encrypt(attendee.responseStatus) : undefined;
                attendee.email = attendee.email ? this.encrypt(attendee.email) : '';
            })

            item.attendees = _attendes;
        }

        return item;
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
                const _events: ICalEventResponse[] = [];
                const _items = result.data.items;

                if (_items) {
                    _items.forEach((item: calendar_v3.Schema$Event) => {
                        const _item = this.mapCalendarResponse(item);
                        _events.push(this.encryptResponse(_item));
                    });
                }

                res.status(200).send({ message: 'OK', events: _events })
            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });
    }

    event = (req: Request, res: Response) => {

    }

    delete = (req: Request, res: Response) => {

        if(req.params && req.params.id)

        this.googleCalendar.Calendar.events.delete({
            calendarId: 'primary',
            eventId: req.params.id,
            sendNotifications: true
        })
        .then((result) => {
            res.status(200).send({message: 'deleted'})
        })
        .catch((err: Error) => {
            res.status(400).send({message: err.message});
        });
    }

    add = (req: Request, res: Response) => {

        if (!req.body || !req.body.start
            || !req.body.end || !req.body.title
            || !req.body.location || !req.body.email
        ) {
            return res.status(400).send({ message: EVENT.MISSING_REQUIRED_ITEMS })
        }
        const _event: ICalEvent = {
            summary: this.decrypt(req.body.title),
            location: this.decrypt(req.body.location),
            description: req.body.comment ? this.decrypt(req.body.comment) : this.decrypt(req.body.title),
            start: this.decrypt(req.body.start),
            end: this.decrypt(req.body.end),
            attendees: [
                { email: this.decrypt(req.body.email) },
            ]
        };
        const _requestBody = {
            summary: _event.summary,
            description: _event.description,
            location: _event.location,
            start: {
                dateTime: `${_event.start}`,
                timeZone: TIMEZONE.WEST
            }, 
            end: {
                dateTime:  `${_event.end}`,
                timeZone: TIMEZONE.WEST
            },
            attendees: _event.attendees
        }

        this.googleCalendar.Calendar.events.insert({
            calendarId: "primary",
            requestBody: _requestBody,
            sendNotifications: true,
        }).then((event) => {

            if (event.data.id)
                return res.status(200).send({ message: EVENT.CREATED, result: this.encrypt(event.data.id) })
            else
                return res.status(400).send({ message: EVENT.FAILED })

        })
            .catch((err) => {
                return res.status(400).send({ message: err.message });
            });

    }
}

export default new EventController();