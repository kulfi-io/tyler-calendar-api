import { secret } from '../config/config.json' 
import * as crypto from 'crypto';
import { ENV } from '../models/enums'
import { IGoogleCalToken } from '../models/interfaces';

export class cryptor {
    private algorithm: string;
    private isProd: boolean;
   
    constructor() {
        this.algorithm = 'aes192';
        this.isProd = process.env.NODE_ENV === ENV.PROD;
    }

    public encrypt = (data: Object): string => {

        let encrypted = '';
        const cipher = crypto.createCipher(this.algorithm, secret);
        encrypted = cipher.update(data.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return this.isProd ? encrypted : data.toString();
    }

    public decrypt(data: Object): string  {

        let decrypted = '';
        const decipher = crypto.createDecipher(this.algorithm, secret);
        decrypted = decipher.update(data.toString(), 'hex', 'utf8');
        decrypted += decipher.final().toString();
        
        // return decrypted;

        return this.isProd ? decrypted : data.toString();
    }

    protected encryptUserCookie(data: Object): string {
        const _jData = JSON.stringify(<IGoogleCalToken>data);
        const _encrypted = this.encrypt(_jData);
        return _encrypted.toString();
    }

    protected decryptUserCookie(data: string):  IGoogleCalToken{
        const _decrypted = JSON.parse(this.decrypt(data));
        return <IGoogleCalToken>_decrypted;
    }
}