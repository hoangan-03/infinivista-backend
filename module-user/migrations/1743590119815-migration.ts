import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743590119815 implements MigrationInterface {
    name = 'Migration1743590119815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "addresss" TO "address"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "address" TO "addresss"`);
    }

}
