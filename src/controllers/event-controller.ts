import * as moment from 'moment';
import BaseController from './base-controller';
import { EVENT, TIMEZONE } from '../models/enums';
import { ICalEvent, IAttendee, ICalEventResponse, ICalTime, ICalEvents } from '../models/interfaces';
import { Request, Response } from 'express';
import { calendar_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';

export class EventController extends BaseController {
    private minTime: moment.Moment;
    private maxTime: moment.Moment

    constructor() {
        super();
        const _now = new Date(Date.now());
        this.minTime = moment(_now).startOf('month');
        this.maxTime = moment(_now).endOf('month');

    }

    private setDate = (date?: Date, scheduled?: boolean) => {

        if (!date && scheduled) {
            const _date = new Date().setMonth(-6);
            const _now = new Date(Date.now());

            this.minTime = moment(_date).startOf('month');
            this.maxTime = moment(_now).endOf('month');
        } else {
            if (date) {
                this.minTime = moment(date).startOf('month');
                this.maxTime = moment(date).endOf('month');
            } else {
                const _now = new Date(Date.now());
                this.minTime = moment(_now).startOf('month');
                this.maxTime = moment(_now).endOf('month');
            }
        }
    }

    private setDateRange = (start: Date, end: Date) => {
        if (start && end) {
            this.minTime = moment(start);
            this.maxTime = moment(end);
        }
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

    private filterByAttendees = (item: calendar_v3.Schema$Event, email: string): calendar_v3.Schema$Event | undefined => {


        if (item.attendees) {
            const _filtered = item.attendees.find(x => x.email === email);
            if (_filtered) {
                return item;
            }

        }

        return undefined;

    }

    private encryptResponse = (item: ICalEventResponse): ICalEventResponse => {
        item.id = item.id ? this.encryptIv(item.id.toString()) : undefined;
        item.summary = item.summary ? this.encryptIv(item.summary.toString()) : undefined;
        item.location = item.location ? this.encryptIv(item.location.toString()) : undefined;
        item.description = item.description ? this.encryptIv(item.description.toString()) : undefined;

        const _start = item.start ? item.start : undefined;
        const _end = item.end ? item.end : undefined;
        const _attendes = item.attendees ? item.attendees : undefined;

        if (_start) {
            _start.dateTime = this.encryptIv(_start.dateTime.toString());
            _start.timeZone = this.encryptIv(_start.timeZone.toString());

            item.start = _start;
        }

        if (_end) {
            _end.dateTime = this.encryptIv(_end.dateTime.toString());
            _end.timeZone = this.encryptIv(_end.timeZone.toString());

            item.end = _end;
        }

        if (_attendes) {

            _attendes.forEach((attendee: IAttendee) => {
                attendee.responseStatus = attendee.responseStatus ? this.encryptIv(attendee.responseStatus.toString()) : undefined;
                attendee.email = attendee.email ? this.encryptIv(attendee.email.toString()) : '';
            })

            item.attendees = _attendes;
        }


        return item;
    }

    private retrieveEventList = (maxResult: number = 300): Promise<GaxiosResponse<calendar_v3.Schema$Events>> => {

        return this.googleCalendar.Calendar.events.list({
            calendarId: 'primary',
            timeMin: this.minTime.toISOString(),
            timeMax: this.maxTime.toISOString(),
            maxResults: maxResult,
            singleEvents: true,
            orderBy: `startTime`,

        });

    }

    private sortDescending = (events: calendar_v3.Schema$Event[]): calendar_v3.Schema$Event[] => {

        events.sort((a, b) => {
            if (a.start && a.start.dateTime && b.start && b.start.dateTime) {

                const _startA = new Date(a.start.dateTime.toString());
                const _startB = new Date(b.start.dateTime.toString());

                const _a = Date.parse(_startA.toISOString());
                const _b = Date.parse(_startB.toISOString());

                return _b - _a;
            } else {
                return 0;
            }


        });

        return events.slice(0, 10);
    }


    eventByTargetUser = (req: Request, res: Response) => {

        if (!req.params.user) {
            return res.status(400).send({ message: 'Missing target user' });
        }

        const _user = this.decrypt(req.params.user);
        this.setDate();

        this.retrieveEventList()
            .then((result) => {
                const _events: ICalEvents = { all: [], targets: [] }
                const _items = result.data.items;

                if (_items) {

                    _items.forEach((item: calendar_v3.Schema$Event) => {
                        const _item = this.mapCalendarResponse(item);
                        const _encryptedItem = this.encryptResponse(_item);
                        _events.all.push(_encryptedItem);

                        const _filtered = this.filterByAttendees(item, _user);
                        if (_filtered)
                            _events.targets.push(_encryptedItem);
                    });


                }


                res.status(200).send({ message: 'OK', events: _events })
            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });
    }


    scheduledEvents = (req: Request, res: Response) => {

        if (!req.params.user) {
            return res.status(400).send({ message: 'Missing target user' });
        }

        const _user = this.decrypt(req.params.user);
        this.setDate(undefined, true);


        this.retrieveEventList()
            .then((result) => {
                const _events: ICalEvents = { all: [], targets: [] }
                let _items = result.data.items;

                if (_items) {

                    const _filtered = _items.filter((item) => {
                        return this.filterByAttendees(item, _user);
                    });

                    const _sorted = this.sortDescending(_filtered);

                    _sorted.forEach((item) => {
                        const _mapped = this.mapCalendarResponse(item);
                        const _encrypted = this.encryptResponse(_mapped);
                        _events.targets.push(_encrypted);
                    });

                }

                res.status(200).send({ message: 'OK', events: _events })
            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });
    }

    eventByTargets = (req: Request, res: Response) => {

        if (!req.params.user || !req.params.date) {
            return res.status(400).send({ message: 'Missing target(s)' });
        }

        const _date = this.decrypt(req.params.date);
        const _user = this.decrypt(req.params.user);

        this.setDate(new Date(_date));

        this.retrieveEventList()
            .then((result) => {
                const _events: ICalEvents = { all: [], targets: [] };
                const _items = result.data.items;

                if (_items) {

                    _items.forEach((item) => {
                        const _mapped = this.mapCalendarResponse(item);
                        const _encrypted = this.encryptResponse(_mapped);
                        _events.all.push(_encrypted);

                        const _filtered = this.filterByAttendees(item, _user);
                        if (_filtered)
                            _events.targets.push(_encrypted);
                    });

                }


                res.status(200).send({ message: 'OK', events: _events })



            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });
    }

    eventSearch = (req: Request, res: Response) => {
        if (!req.params.start || !req.params.end) {
            return res.status(400).send({ message: 'Missing target(s)' });
        }

        const _start = new Date(this.decrypt(req.params.start));
        const _end = new Date(this.decrypt(req.params.end));

        this.setDateRange(_start, _end);

        this.retrieveEventList()
            .then((result) => {
                const _events: ICalEvents = { all: [], targets: [] };
                const _items = result.data.items;


                if (_items) {

                    _items.forEach((item) => {
                        const _mapped = this.mapCalendarResponse(item);
                        const _encrypted = this.encryptResponse(_mapped);
                        _events.all.push(_encrypted);
                    });

                }

                res.status(200).send({ message: 'OK', events: _events })
            })
            .catch((err: Error) => {
                res.status(400).send({ message: err.message });
            });


    }

    events = (req: Request, res: Response) => {

        if (req.params.date) {
            const _date = this.decrypt(req.params.date);
            this.setDate(new Date(_date));
        } else {
            this.setDate();
        }


        this.retrieveEventList()
            .then((result) => {
                let _events: ICalEvents = { all: [], targets: [] };
                const _items = result.data.items;

                if (_items) {

                    _items.forEach((item) => {
                        const _mapped = this.mapCalendarResponse(item);
                        const _encrypted = this.encryptResponse(_mapped);
                        _events.all.push(_encrypted);
                    });

                    _events.targets = _events.all;


                    // _items.forEach((item: calendar_v3.Schema$Event) => {
                    //     const _item = this.mapCalendarResponse(item);
                    //     const _encryptedItem = this.encryptResponse(_item);
                    //     _events.all.push(_encryptedItem);
                    //     //_events.push(this.encryptResponse(_item));
                    // });
                    // _events.targets = _events.all;
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

        if (req.params && req.params.id)

            this.googleCalendar.Calendar.events.delete({
                calendarId: 'primary',
                eventId: req.params.id,
                sendNotifications: true
            })
                .then((result) => {
                    res.status(200).send({ message: 'deleted' })
                })
                .catch((err: Error) => {
                    res.status(400).send({ message: err.message });
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
            summary: this.decryptIv(req.body.title),
            location: this.decryptIv(req.body.location),
            description: req.body.comment ? this.decryptIv(req.body.comment) : this.decryptIv(req.body.title),
            start: this.decryptIv(req.body.start),
            end: this.decryptIv(req.body.end),
            attendees: [
                { email: this.decryptIv(req.body.email) },
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
                dateTime: `${_event.end}`,
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