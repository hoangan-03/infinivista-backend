import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1744775637942 implements MigrationInterface {
    name = 'Migration1744775637942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group_chat" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "group_chat_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_name" character varying NOT NULL, "group_image_url" character varying, CONSTRAINT "PK_e751be0b8548b7873ec2b518d38" PRIMARY KEY ("group_chat_id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "delete_at" TIMESTAMP, "last_modified_at" TIMESTAMP, "status" "public"."message_status_enum" NOT NULL, "emotion" "public"."message_emotion_enum", "messageText" character varying NOT NULL DEFAULT 'Defaault message', "senderId" character varying, "receiverId" character varying, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_attachment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attachment_url" character varying NOT NULL, "attachment_name" character varying, "sent_at" TIMESTAMP, "seen_at" TIMESTAMP, "delete_at" TIMESTAMP, "status" "public"."message_attachment_status_enum" NOT NULL, "emotion" "public"."message_attachment_emotion_enum", "senderId" character varying, "receiverId" character varying, CONSTRAINT "PK_d5bc54379802d99c07cd7ec00e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" ADD CONSTRAINT "FK_4143702fc40cc2da79296c7ab03" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" ADD CONSTRAINT "FK_49700a700d0bf148076a667e7fe" FOREIGN KEY ("groupChatGroupChatId") REFERENCES "group_chat"("group_chat_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906595c602056d936fc13" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_77869b789b961cff4f5015148cb" FOREIGN KEY ("senderId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_9fb83fa0387f071a16e90b54864" FOREIGN KEY ("receiverId") REFERENCES "user_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_9fb83fa0387f071a16e90b54864"`);
        await queryRunner.query(`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_77869b789b961cff4f5015148cb"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_71fb36906595c602056d936fc13"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`ALTER TABLE "group_chat_message" DROP CONSTRAINT "FK_49700a700d0bf148076a667e7fe"`);
        await queryRunner.query(`ALTER TABLE "group_chat_attachment" DROP CONSTRAINT "FK_4143702fc40cc2da79296c7ab03"`);
        await queryRunner.query(`DROP TABLE "message_attachment"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "group_chat"`);
    }

}
