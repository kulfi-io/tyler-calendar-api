import { secret } from '../config/config.json'
import * as crypto from 'crypto';
import { ENV } from '../models/enums'
import { ICryptoData } from '../models/interfaces';

export class cryptor {
    private algorithm: string;
    private isProd: boolean;
    private algorithmIv: string;
    private key: Buffer;
    private iv: Buffer | undefined;

    constructor() {
        this.algorithm = 'aes192';
        this.isProd = process.env.NODE_ENV === ENV.PROD;

        this.algorithmIv = 'aes-256-cbc';

        const _key = Buffer.alloc(32);

        this.key = Buffer.concat([Buffer.from(secret)], _key.length)
    }

    public encrypt = (data: Object): string => {

        let encrypted = '';
        const cipher = crypto.createCipher(this.algorithm, secret);
        encrypted = cipher.update(data.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return this.isProd ? encrypted : data.toString();
    }

    protected encryptIv = (data: string): ICryptoData | string => {
        if (this.isProd) {
            this.iv = crypto.randomBytes(16);

            let cipher = crypto.createCipheriv(this.algorithmIv.toString(), this.key, this.iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return {
                iv: this.iv.toString('hex'),
                encryptedData: encrypted
            };

        }

        return data;
    }


    public decrypt(data: Object): string {

        let decrypted = '';
        const decipher = crypto.createDecipher(this.algorithm, secret);
        decrypted = decipher.update(data.toString(), 'hex', 'utf8');
        decrypted += decipher.final().toString();

        // return decrypted;

        return this.isProd ? decrypted : data.toString();
    }

    protected decryptIv = (data: string): string => {
        if (this.isProd) {
            const _stringifiedData = JSON.stringify(data);
            const _data = <ICryptoData>JSON.parse(_stringifiedData);

            let iv = Buffer.from(_data.iv, 'hex');
            let decipher = crypto.createDecipheriv(this.algorithmIv, this.key, iv);

            let decrypted = decipher.update(_data.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;

        }

        return data;
    }


}