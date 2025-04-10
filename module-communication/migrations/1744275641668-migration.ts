import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1744275641668 implements MigrationInterface {
    name = 'Migration1744275641668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "call_history" ("call_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "callerId" character varying, "receiverId" character varying, CONSTRAINT "PK_f7ced49106aa7e0566991bd4c18" PRIMARY KEY ("call_id"))`);
        await queryRunner.query(`CREATE TABLE "message_attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attachment_url" character varying NOT NULL, "attachment_name" character varying NOT NULL, "messageId" uuid, CONSTRAINT "PK_d5bc54379802d99c07cd7ec00e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_text" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, CONSTRAINT "PK_ca4c885c251c214e5095b095d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_status_enum" AS ENUM('SENT_FAILED', 'SENT', 'RECEIVED', 'SEEN', 'DELETED', 'HIDDEN')`);
        await queryRunner.query(`CREATE TYPE "public"."message_emotion_enum" AS ENUM('smile', 'laugh', 'wink', 'sad', 'angry', 'surprised', 'crying', 'heart', 'thumbs_up', 'thumbs_down')`);
        await queryRunner.query(`CREATE TYPE "public"."message_type_enum" AS ENUM('TEXT', 'ATTACHMENT')`);
        await queryRunner.query(`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "delete_at" TIMESTAMP, "last_modified_at" TIMESTAMP, "status" "public"."message_status_enum" NOT NULL, "emotion" "public"."message_emotion_enum", "type" "public"."message_type_enum" NOT NULL, "textMessageId" uuid, "senderId" character varying, "receiverId" character varying, CONSTRAINT "REL_b8fc5bd7ba3e7b64acdc0f7747" UNIQUE ("textMessageId"), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_reference" ("id" character varying NOT NULL, CONSTRAINT "PK_f4b3a634a34b54148b7fcae09be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."group_chat_message_status_enum" AS ENUM('SENT_FAILED', 'SENT', 'RECEIVED', 'SEEN', 'DELETED', 'HIDDEN')`);
        await queryRunner.query(`CREATE TABLE "group_chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "delete_at" TIMESTAMP, "last_modified_at" TIMESTAMP, "status" "public"."group_chat_message_status_enum" NOT NULL, "emotion" text, "textMessageId" uuid, "senderId" character varying, "groupChatGroupChatId" uuid, CONSTRAINT "REL_82c73d04a8704d19882d9151b5" UNIQUE ("textMessageId"), CONSTRAINT "PK_27f47aacf67f87c4d9b3c2e988f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat" ("group_chat_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_name" character varying NOT NULL, "group_image_url" character varying, CONSTRAINT "PK_e751be0b8548b7873ec2b518d38" PRIMARY KEY ("group_chat_id"))`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD CONSTRAINT "FK_387e92885b03494a36dc213fb99" FOREIGN KEY ("callerId") REFERENCES "user_reference"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD CONSTRAINT "FK_85dd9a58f59de39926a180070ce" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_b8fc5bd7ba3e7b64acdc0f7747d" FOREIGN KEY ("textMessageId") REFERENCES "message_text"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906595c602056d936fc13" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_82c73d04a8704d19882d9151b5b" FOREIGN KEY ("textMessageId") REFERENCES "message_text"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_cc95a387a775a323120d783fe8c" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_49700a700d0bf148076a667e7fe" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_49700a700d0bf148076a667e7fe"`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_cc95a387a775a323120d783fe8c"`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_82c73d04a8704d19882d9151b5b"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_71fb36906595c602056d936fc13"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_b8fc5bd7ba3e7b64acdc0f7747d"`);
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP CONSTRAINT "FK_85dd9a58f59de39926a180070ce"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP CONSTRAINT "FK_387e92885b03494a36dc213fb99"`);
        await queryRunner.query(`DROP TABLE "group_chat"`);
        await queryRunner.query(`DROP TABLE "group_chat_message"`);
        await queryRunner.query(`DROP TYPE "public"."group_chat_message_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_reference"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TYPE "public"."message_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_emotion_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_status_enum"`);
        await queryRunner.query(`DROP TABLE "message_text"`);
        await queryRunner.query(`DROP TABLE "message_attachment"`);
        await queryRunner.query(`DROP TABLE "call_history"`);
    }

}
