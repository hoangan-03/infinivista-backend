import { MigrationInterface, QueryRunner } from "typeorm";

export class MyMigration1736346875142 implements MigrationInterface {
    name = 'MyMigration1736346875142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "cardLastFour"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "paymentToken"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "cardExpirationDate"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "cardExpirationDate" date`);
        await queryRunner.query(`ALTER TABLE "user" ADD "paymentToken" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "cardLastFour" character(4)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "paymentMethod" character varying(50)`);
    }

}
