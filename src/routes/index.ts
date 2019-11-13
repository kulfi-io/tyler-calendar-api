import { BaseRoute } from './base-route'
import { Router } from 'express';
import calendar from '../controllers/calendar-controller';
import event from '../controllers/event-controller';

export class MailerRouter extends BaseRoute {
   
    constructor() {
        super();
    }

    public map(router: Router) {
        router.get('/', this.responseData);
        router.get('/v1/cal-list', calendar.calendarlist);
        // router.get('/v1/events', event.events);
        router.get('/v1/events-by-date/:date?', event.events);
        router.get('/v1/events-by-user/:user', event.eventByTargetUser);
        router.get('/v1/events-by-targets/:date/:user', event.eventByTargets);
        router.post('/v1/event', event.add);
        router.delete('/v1/event/:id', event.delete);
    }
}

export default new MailerRouter();