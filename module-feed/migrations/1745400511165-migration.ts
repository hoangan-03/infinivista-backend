import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745400511165 implements MigrationInterface {
    name = 'Migration1745400511165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" ADD "storyId" uuid`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_fe13edd1431a248a0eeac11ae43" FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_fe13edd1431a248a0eeac11ae43"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "storyId"`);
    }

}
