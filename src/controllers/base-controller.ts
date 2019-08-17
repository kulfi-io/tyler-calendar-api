import { cryptor } from '../library/cryptor';
import { GoogleCalendar } from './google-calendar-controller';
import { Types } from 'mongoose';


export default class BaseController extends cryptor {
    protected googleCalendar: typeof GoogleCalendar;

    constructor() {
        super();
        this.googleCalendar = GoogleCalendar;
    }

    private convertToTarget<T>(target: Object): T {
        return <T>target;
    }
   
    protected convertToSchemaType<P, O>(target: Object): O {
        const _primary = this.convertToTarget<P>(target);
        const _output = this.convertToTarget<O>(_primary);

        return _output;
    }

    protected encrypt = (data: Object): string => {
        return this.encrypt(data);
    }

    protected decrypt(data: Object): string {
        return this.decrypt(data);
    }

    protected mongoIdObjectToString(data: Types.ObjectId): string {
        var _id = <Object>data;
        return _id.toString();
    }

    protected mongoIdObject(data: string): Types.ObjectId {
        var _id = Types.ObjectId(data);
        return _id;
    }
}

