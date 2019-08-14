import * as config from '../config/config.json';
import * as crypto from 'crypto';
import { ENV } from '../models/enums';
import { Types } from 'mongoose';

export class BaseController {
    protected isProd: boolean;
    private algorithm: string;

    constructor() {
        this.isProd = process.env.NODE_ENV === ENV.PROD;
        this.algorithm = 'aes192';
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
        let encrypted = '';
        const cipher = crypto.createCipher(this.algorithm, config.secret);

        encrypted = cipher.update(data.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return this.isProd ? encrypted : data.toString();
    }

    protected decrypt(data: Object): string  {

        let decrypted = '';
        const decipher = crypto.createDecipher(this.algorithm, config.secret);
        decrypted = decipher.update(data.toString(), 'hex', 'utf8');
        decrypted += decipher.final().toString();

        return  this.isProd ? decrypted : data.toString();
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

export default new BaseController();