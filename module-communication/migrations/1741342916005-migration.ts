import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741342916005 implements MigrationInterface {
    name = 'Migration1741342916005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "call_histories" ("call_id" SERIAL NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, CONSTRAINT "PK_362ebf61b1c6f58a14ef1433c65" PRIMARY KEY ("call_id"))`);
        await queryRunner.query(`CREATE TABLE "message_text" ("id" SERIAL NOT NULL, "text" text NOT NULL, "messageMessageId" integer, CONSTRAINT "PK_ca4c885c251c214e5095b095d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_attachment" ("id" SERIAL NOT NULL, "attachment_url" character varying NOT NULL, "attachment_name" character varying NOT NULL, "messageMessageId" integer, CONSTRAINT "PK_d5bc54379802d99c07cd7ec00e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_messages_user" ("id" SERIAL NOT NULL, "messageMessageId" integer, CONSTRAINT "PK_c9caa82a017083ee03444ffecdf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("message_id" SERIAL NOT NULL, "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "is_seen" boolean NOT NULL DEFAULT false, "is_deleted" boolean NOT NULL DEFAULT false, "is_hidden" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_06a563cdbd963a9f7cbcb25c447" PRIMARY KEY ("message_id"))`);
        await queryRunner.query(`CREATE TABLE "user_messages_group_chat" ("id" SERIAL NOT NULL, "messageMessageId" integer, "groupChatGroupChatId" integer, CONSTRAINT "PK_40a32d244b8e4c13a92fa9a8acc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat" ("group_chat_id" SERIAL NOT NULL, "group_name" character varying NOT NULL, "group_image_url" character varying, CONSTRAINT "PK_e751be0b8548b7873ec2b518d38" PRIMARY KEY ("group_chat_id"))`);
        await queryRunner.query(`ALTER TABLE "message_text" ADD CONSTRAINT "FK_17652d2faa0c269cacd68a4d19e" FOREIGN KEY ("messageMessageId") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_e661cf72594d4f94d80c90dea68" FOREIGN KEY ("messageMessageId") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_messages_user" ADD CONSTRAINT "FK_4b95010f5a181bc39613f1a562f" FOREIGN KEY ("messageMessageId") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_messages_group_chat" ADD CONSTRAINT "FK_653c215397cb8f2416c212f9068" FOREIGN KEY ("messageMessageId") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_messages_group_chat" ADD CONSTRAINT "FK_d50b5b74fba04b5de3e21a07a23" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_messages_group_chat" DROP CONSTRAINT "FK_d50b5b74fba04b5de3e21a07a23"`);
        await queryRunner.query(`ALTER TABLE "user_messages_group_chat" DROP CONSTRAINT "FK_653c215397cb8f2416c212f9068"`);
        await queryRunner.query(`ALTER TABLE "user_messages_user" DROP CONSTRAINT "FK_4b95010f5a181bc39613f1a562f"`);
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_e661cf72594d4f94d80c90dea68"`);
        await queryRunner.query(`ALTER TABLE "message_text" DROP CONSTRAINT "FK_17652d2faa0c269cacd68a4d19e"`);
        await queryRunner.query(`DROP TABLE "group_chat"`);
        await queryRunner.query(`DROP TABLE "user_messages_group_chat"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "user_messages_user"`);
        await queryRunner.query(`DROP TABLE "message_attachment"`);
        await queryRunner.query(`DROP TABLE "message_text"`);
        await queryRunner.query(`DROP TABLE "call_histories"`);
    }

}
