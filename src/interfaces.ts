import { tokenResponseMessage } from './enums';

export interface ICandidateMsg {
    label: number;
    id: string;
    candidate: string;
}

export interface IBmrUtilityResponse {
    user_name: string;
    bmr_serial_key: string;
    access_token: string;
    remote_disabled: number;
}

export interface IConnectionQuery {
    accessToken: string;
    userName: string;
    isHost: boolean;
    serialKey: string;
}

export interface IValidateTokenResponse {
    root: {
        status: {
            _attributes: {
                desc: string;
                message: tokenResponseMessage;
            };
        };
    };
}
