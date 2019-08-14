import { BaseRoute } from './base-route'
import { Router } from 'express';
import calendar from '../controllers/calendar-controller';

export class MailerRouter extends BaseRoute {
   
    constructor() {
        super();
    }

    public map(router: Router) {
        router.post('/v1/event', calendar.addEvent);
        router.get('/v1/event',  calendar.getEvents);
        router.get('/v1/event/:id', calendar.getEvent);
        router.delete('/v1/event/:id', calendar.deleteEvent);
        router.put('/v1/event/:id', calendar.updateEvent);
    }
}

export default new MailerRouter();