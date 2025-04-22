import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745313498012 implements MigrationInterface {
    name = 'Migration1745313498012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "call_history" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "call_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP, "accepted_at" TIMESTAMP, "status" "public"."call_history_status_enum" NOT NULL DEFAULT 'initiated', "type" "public"."call_history_type_enum" NOT NULL DEFAULT 'audio', "callerId" character varying, "receiverId" character varying, CONSTRAINT "PK_f7ced49106aa7e0566991bd4c18" PRIMARY KEY ("call_id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat_attachment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "delete_at" TIMESTAMP, "status" "public"."group_chat_attachment_status_enum" NOT NULL, "emotion" text, "attachment_url" character varying NOT NULL, "attachment_name" character varying, "attachmentType" "public"."group_chat_attachment_attachmenttype_enum" NOT NULL, "senderId" character varying, "groupChatGroupChatId" uuid, CONSTRAINT "PK_4a760e34a7caa60a896a72e7661" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat_message" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "delete_at" TIMESTAMP, "last_modified_at" TIMESTAMP, "status" "public"."group_chat_message_status_enum" NOT NULL, "emotion" text, "textMessage" character varying NOT NULL DEFAULT 'Default message', "senderId" character varying, "groupChatGroupChatId" uuid, CONSTRAINT "PK_27f47aacf67f87c4d9b3c2e988f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "group_chat_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_name" character varying(255) NOT NULL, "group_image_url" character varying, CONSTRAINT "PK_e751be0b8548b7873ec2b518d38" PRIMARY KEY ("group_chat_id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "delete_at" TIMESTAMP, "last_modified_at" TIMESTAMP, "status" "public"."message_status_enum" NOT NULL, "emotion" "public"."message_emotion_enum", "messageText" character varying NOT NULL DEFAULT 'Defaault message', "senderId" character varying, "receiverId" character varying, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_attachment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attachment_url" character varying NOT NULL, "attachment_name" character varying, "attachmentType" "public"."message_attachment_attachmenttype_enum" NOT NULL, "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "delete_at" TIMESTAMP, "status" "public"."message_attachment_status_enum" NOT NULL, "emotion" "public"."message_attachment_emotion_enum", "senderId" character varying, "receiverId" character varying, CONSTRAINT "PK_d5bc54379802d99c07cd7ec00e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_chat_users" ("groupChatGroupChatId" uuid NOT NULL, "userReferenceId" character varying NOT NULL, CONSTRAINT "PK_d3ebbf30ea7a897dad159ce1508" PRIMARY KEY ("groupChatGroupChatId", "userReferenceId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_974158d6d4d6f7b20a292729b7" ON "group_chat_users" ("groupChatGroupChatId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e0df94a2e901f60a8ccb209b64" ON "group_chat_users" ("userReferenceId") `);
        await queryRunner.query(`ALTER TABLE "call_history" ADD CONSTRAINT "FK_387e92885b03494a36dc213fb99" FOREIGN KEY ("callerId") REFERENCES "user_reference"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD CONSTRAINT "FK_85dd9a58f59de39926a180070ce" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" ADD CONSTRAINT "FK_373f65efda5daa7411d7c5f01f7" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" ADD CONSTRAINT "FK_4143702fc40cc2da79296c7ab03" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_cc95a387a775a323120d783fe8c" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_49700a700d0bf148076a667e7fe" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906595c602056d936fc13" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_77869b789b961cff4f5015148cb" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_9fb83fa0387f071a16e90b54864" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_users" ADD CONSTRAINT "FK_974158d6d4d6f7b20a292729b70" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "group_chat_users" ADD CONSTRAINT "FK_e0df94a2e901f60a8ccb209b640" FOREIGN KEY ("userReferenceId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group_chat_users" DROP CONSTRAINT "FK_e0df94a2e901f60a8ccb209b640"`);
        await queryRunner.query(`ALTER TABLE "group_chat_users" DROP CONSTRAINT "FK_974158d6d4d6f7b20a292729b70"`);
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_9fb83fa0387f071a16e90b54864"`);
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_77869b789b961cff4f5015148cb"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_71fb36906595c602056d936fc13"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_49700a700d0bf148076a667e7fe"`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_cc95a387a775a323120d783fe8c"`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" DROP CONSTRAINT "FK_4143702fc40cc2da79296c7ab03"`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" DROP CONSTRAINT "FK_373f65efda5daa7411d7c5f01f7"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP CONSTRAINT "FK_85dd9a58f59de39926a180070ce"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP CONSTRAINT "FK_387e92885b03494a36dc213fb99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0df94a2e901f60a8ccb209b64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_974158d6d4d6f7b20a292729b7"`);
        await queryRunner.query(`DROP TABLE "group_chat_users"`);
        await queryRunner.query(`DROP TABLE "message_attachment"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "group_chat"`);
        await queryRunner.query(`DROP TABLE "group_chat_message"`);
        await queryRunner.query(`DROP TABLE "group_chat_attachment"`);
        await queryRunner.query(`DROP TABLE "call_history"`);
    }

}
