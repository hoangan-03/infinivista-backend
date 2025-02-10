import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738925221693 implements MigrationInterface {
    name = 'Migration1738925221693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."settings_type_enum" AS ENUM('NOTIFICATION', 'THEME', 'LANGUAGE', 'ACCOUNT_PRIVACY', 'POST_PRIVACY')`);
        await queryRunner.query(`CREATE TABLE "settings" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."settings_type_enum" NOT NULL, "value" text NOT NULL, CONSTRAINT "UQ_2de0a4587b90a14bb0162152244" UNIQUE ("user_id", "type"), CONSTRAINT "REL_a2883eaa72b3b2e8c98e744609" UNIQUE ("user_id"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "security_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" character varying(255) NOT NULL, CONSTRAINT "PK_40863dac02e72e1ea928b07d5ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "security_answers" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "answer" character varying(255) NOT NULL, "question_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_5f07661b5533b7d8b00b3373b17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_methods_payment_method_enum" AS ENUM('CASH', 'PAYPAL')`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_method" "public"."payment_methods_payment_method_enum" NOT NULL DEFAULT 'PAYPAL', "card_last_four" character varying(4), "payment_token" character varying(255), "card_expiration_date" character varying(5), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_a2883eaa72b3b2e8c98e7446098" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_answers" ADD CONSTRAINT "FK_fe380325023cf2d5067da6d16f8" FOREIGN KEY ("question_id") REFERENCES "security_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_answers" ADD CONSTRAINT "FK_5a4700babcaeed37e975723483c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "security_answers" DROP CONSTRAINT "FK_5a4700babcaeed37e975723483c"`);
        await queryRunner.query(`ALTER TABLE "security_answers" DROP CONSTRAINT "FK_fe380325023cf2d5067da6d16f8"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_a2883eaa72b3b2e8c98e7446098"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TYPE "public"."payment_methods_payment_method_enum"`);
        await queryRunner.query(`DROP TABLE "security_answers"`);
        await queryRunner.query(`DROP TABLE "security_questions"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TYPE "public"."settings_type_enum"`);
    }

}
