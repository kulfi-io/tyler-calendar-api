import * as token from '../config/token.json';
import { calendar_v3, google } from 'googleapis';
import { GetAccessTokenResponse, OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { IGoogleCalToken } from 'src/models/interfaces.js';
import { installed } from '../config/credentials.json';

export class GoogleCalendar {
    private static instance: GoogleCalendar;
    private _tokenRefreshed?: IGoogleCalToken;
    private _authClient: OAuth2Client;
    private _calendar: calendar_v3.Calendar;
    private _expired?: boolean;

    constructor() {

        this._authClient = new google.auth.OAuth2(
            installed.client_id,
            installed.client_secret,
        );

        this._expired = this.tokenExpired();

        this.validateToken();

        this._calendar = google.calendar({
            version: "v3",
            auth: this._authClient
        });
       
    }

    public static get Calendar() {
        if (!GoogleCalendar.instance) {
            GoogleCalendar.instance = new GoogleCalendar();
        }
        return GoogleCalendar.instance._calendar;
    }

    public static get Expired() {
        if (!GoogleCalendar.instance) {
            GoogleCalendar.instance = new GoogleCalendar();
        }
        return GoogleCalendar.instance._expired;
    }

    private tokenExpired = (): boolean => {

        const _expiry = this._tokenRefreshed
            ? this._tokenRefreshed.expiry_date : token.expiry_date;

        return parseInt(_expiry.toString()) <= Math.trunc(Date.now());
    }

    private validateToken = () => {
        if (this.tokenExpired) {

            this._authClient.setCredentials({
                refresh_token: token.refresh_token,
            });

            this._authClient.getAccessToken()
                .then((result: GetAccessTokenResponse) => {
                    if (result && result.res && result.res.data) {
                        this._tokenRefreshed = result.res.data;
                    }
                })
                .catch((err) => {
                    console.debug(err);
                });
        }
    }

}