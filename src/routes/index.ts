import { BaseRoute } from './base-route'
import { Router } from 'express';
import calendar from '../controllers/calendar-controller';
import event from '../controllers/event-controller';

export class MailerRouter extends BaseRoute {
   
    constructor() {
        super();
    }

    public map(router: Router) {
        router.get('/v1/cal-list', calendar.calendarlist);
        router.get('/v1/events', event.events);
        router.post('/v1/event', event.add);
    }
}

export default new MailerRouter();