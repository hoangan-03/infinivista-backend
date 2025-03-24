import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1742812300852 implements MigrationInterface {
    name = 'Migration1742812300852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "security_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" character varying(255) NOT NULL, CONSTRAINT "PK_40863dac02e72e1ea928b07d5ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "security_answers" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "answer" character varying(255) NOT NULL, "question_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_5f07661b5533b7d8b00b3373b17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."settings_type_enum" NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_status" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "isOnline" boolean NOT NULL DEFAULT false, "isSuspended" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_9bab6c49e02f517fd2efd6c1a9" UNIQUE ("user_id"), CONSTRAINT "PK_892a2061d6a04a7e2efe4c26d6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "username" character varying(255) NOT NULL, "password" character varying(255), "phoneNumber" character varying(15), "dob" date, "firstName" character varying(255), "lastName" character varying(255), "profileImageUrl" text, "coverImageUrl" text, "address" text, "profilePrivacy" "public"."users_profileprivacy_enum" NOT NULL DEFAULT 'public', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_method" "public"."payment_methods_payment_method_enum" NOT NULL DEFAULT 'PAYPAL', "card_last_four" character varying(4), "payment_token" character varying(255), "card_expiration_date" character varying(5), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_f2534e418d51fa6e5e8cdd4b480" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_c9d447f72456a67d17ec30c5d00" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_c034dd387df6cd4ce9aaebdd480" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_67ede80121abbc1e6eb2c392288" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_answers" ADD CONSTRAINT "FK_fe380325023cf2d5067da6d16f8" FOREIGN KEY ("question_id") REFERENCES "security_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_answers" ADD CONSTRAINT "FK_5a4700babcaeed37e975723483c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_a2883eaa72b3b2e8c98e7446098" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_status" ADD CONSTRAINT "FK_9bab6c49e02f517fd2efd6c1a91" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_status" DROP CONSTRAINT "FK_9bab6c49e02f517fd2efd6c1a91"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_a2883eaa72b3b2e8c98e7446098"`);
        await queryRunner.query(`ALTER TABLE "security_answers" DROP CONSTRAINT "FK_5a4700babcaeed37e975723483c"`);
        await queryRunner.query(`ALTER TABLE "security_answers" DROP CONSTRAINT "FK_fe380325023cf2d5067da6d16f8"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_67ede80121abbc1e6eb2c392288"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_c034dd387df6cd4ce9aaebdd480"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_c9d447f72456a67d17ec30c5d00"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_f2534e418d51fa6e5e8cdd4b480"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_status"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "security_answers"`);
        await queryRunner.query(`DROP TABLE "security_questions"`);
    }

}
