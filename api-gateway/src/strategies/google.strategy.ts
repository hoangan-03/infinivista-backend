import {Inject, Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy, StrategyOptions, VerifyCallback} from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        @Inject('USER_SERVICE') private userClient: ClientProxy
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        } as StrategyOptions);
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        try {
            const {name, emails} = profile;

            const userData = {
                email: emails[0].value,
                firstName: name.givenName,
                lastName: name.familyName,
                accessToken: accessToken,
            };

            // Just pass the user data to the route handler
            // The actual validation will be done in the controller
            return userData;
        } catch (error) {
            done(error, false);
        }
    }
}
