export interface IGoogCredentials {
    clientId: string;
    projectId: string;
    authUri: string;
    tokenUri: string;
    secret: string;
    origins: string[];
    authProviderx509CertUrl: string;
}

export interface IGoogleCalToken {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
}

export interface ICalTime {
    dateTime: string;
    timeZone: string;
}

export interface IAttendee {
    email: string;
}

export interface IOverride {
    method: string;
    minutes: number;
}

export interface ICalEvent {
    summary: string;
    location: string;
    description: string;
    start: ICalTime;
    end: ICalTime;
    recurrence: [];
    attendees: IAttendee[];
    reminders: {
        useDefault: boolean;
        overrides: IOverride[]
    }
}

export interface IEvent {
    summary: string;
    location: string;
    description: string;
    start: string;
    end: string;
    email: string;
}
