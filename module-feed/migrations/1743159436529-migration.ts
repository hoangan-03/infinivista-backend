import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743159436529 implements MigrationInterface {
    name = 'Migration1743159436529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "advertisement" ("id" SERIAL NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, CONSTRAINT "PK_c8486834e5ef704ec05b7564d89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "live_stream_history" ("id" SERIAL NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "stream_url" character varying NOT NULL, "view_count" integer NOT NULL, "newsFeedId" integer, CONSTRAINT "PK_2d52bb9eb3976f3c609e3da86ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_references" ("id" character varying NOT NULL, "news_feed_id" integer, CONSTRAINT "REL_02762bca5428b1a9125dfaa096" UNIQUE ("news_feed_id"), CONSTRAINT "PK_0a7e184c07fc1802dec3359e2c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "text" text NOT NULL, "attachment_url" character varying NOT NULL, "userId" character varying, "postId" uuid, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attachment_url" character varying NOT NULL, "postId" uuid, CONSTRAINT "PK_49a1b6707f8b1d1be26ee91b28d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "newsFeedId" integer, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reel" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reel_url" character varying NOT NULL, "duration" integer NOT NULL, CONSTRAINT "PK_e52f2a258bef0ce06b3559c4f1a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "story" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "story_url" character varying NOT NULL, "duration" integer NOT NULL, CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hash_tag" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_a6640a31d78e11097a949656191" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reaction_reaction_type_enum" AS ENUM('LIKE', 'HEART', 'CARE', 'SAD', 'WOW', 'ANGRY')`);
        await queryRunner.query(`CREATE TABLE "reaction" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "reaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reaction_type" "public"."reaction_reaction_type_enum" NOT NULL, "reaction_image_url" character varying NOT NULL, "newsFeedId" integer, CONSTRAINT "PK_e9807227100a65201ee75f09cd9" PRIMARY KEY ("reaction_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."news_feed_visibility_enum" AS ENUM('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE')`);
        await queryRunner.query(`CREATE TABLE "news_feed" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "description" text, "visibility" "public"."news_feed_visibility_enum" NOT NULL DEFAULT 'PUBLIC', "reelId" uuid, "communityId" character varying, CONSTRAINT "REL_f44d88904dcffb222e66aa1ad6" UNIQUE ("reelId"), CONSTRAINT "PK_9325de5b82b32b083a96e63d8d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "live_stream_history" ADD CONSTRAINT "FK_c39a2f32773b8742dc5b46c7e15" FOREIGN KEY ("newsFeedId") REFERENCES "news_feed"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_references" ADD CONSTRAINT "FK_02762bca5428b1a9125dfaa0960" FOREIGN KEY ("news_feed_id") REFERENCES "news_feed"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b" FOREIGN KEY ("userId") REFERENCES "user_references"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_94a85bb16d24033a2afdd5df060" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_attachment" ADD CONSTRAINT "FK_3600075c4245dabf18dd0be13ad" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_c215a093fa78ce12330109826d3" FOREIGN KEY ("newsFeedId") REFERENCES "news_feed"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reaction" ADD CONSTRAINT "FK_f5769315aae85dcee82e5452a1b" FOREIGN KEY ("newsFeedId") REFERENCES "news_feed"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "news_feed" ADD CONSTRAINT "FK_f44d88904dcffb222e66aa1ad61" FOREIGN KEY ("reelId") REFERENCES "reel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "news_feed" ADD CONSTRAINT "FK_cb70805dced6477b081704ae4a9" FOREIGN KEY ("communityId") REFERENCES "community_reference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_feed" DROP CONSTRAINT "FK_cb70805dced6477b081704ae4a9"`);
        await queryRunner.query(`ALTER TABLE "news_feed" DROP CONSTRAINT "FK_f44d88904dcffb222e66aa1ad61"`);
        await queryRunner.query(`ALTER TABLE "reaction" DROP CONSTRAINT "FK_f5769315aae85dcee82e5452a1b"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_c215a093fa78ce12330109826d3"`);
        await queryRunner.query(`ALTER TABLE "post_attachment" DROP CONSTRAINT "FK_3600075c4245dabf18dd0be13ad"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_94a85bb16d24033a2afdd5df060"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b"`);
        await queryRunner.query(`ALTER TABLE "user_references" DROP CONSTRAINT "FK_02762bca5428b1a9125dfaa0960"`);
        await queryRunner.query(`ALTER TABLE "live_stream_history" DROP CONSTRAINT "FK_c39a2f32773b8742dc5b46c7e15"`);
        await queryRunner.query(`DROP TABLE "news_feed"`);
        await queryRunner.query(`DROP TYPE "public"."news_feed_visibility_enum"`);
        await queryRunner.query(`DROP TABLE "reaction"`);
        await queryRunner.query(`DROP TYPE "public"."reaction_reaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "hash_tag"`);
        await queryRunner.query(`DROP TABLE "story"`);
        await queryRunner.query(`DROP TABLE "reel"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "post_attachment"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "user_references"`);
        await queryRunner.query(`DROP TABLE "live_stream_history"`);
        await queryRunner.query(`DROP TABLE "advertisement"`);
    }

}
