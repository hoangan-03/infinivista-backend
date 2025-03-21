import {Inject, Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {Profile, Strategy, StrategyOptions} from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
        private configService: ConfigService,
        @Inject('USER_SERVICE') private userClient: ClientProxy
    ) {
        super({
            clientID: configService.get<string>('FACEBOOK_APP_ID'),
            clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
            callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
            profileFields: ['id', 'emails', 'name'],
            scope: ['email'],
        } as StrategyOptions);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (err: any, user: any, info?: any) => void
    ): Promise<any> {
        try {
            const {name, emails} = profile;

            // Handle case when Facebook doesn't return an email
            const email = emails && emails.length > 0 ? emails[0].value : `${profile.id}@facebook.com`;

            const userData = {
                email: email,
                firstName: name?.givenName,
                lastName: name?.familyName,
                provider: 'facebook',
                providerId: profile.id,
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
