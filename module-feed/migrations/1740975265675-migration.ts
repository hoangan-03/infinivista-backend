import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740975265675 implements MigrationInterface {
    name = 'Migration1740975265675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_comments_news_feed" ("id" SERIAL NOT NULL, "comment" text NOT NULL, "parent_comment_id" integer, "newsFeedNewsFeedId" integer, CONSTRAINT "PK_e04e490a266683aea8078c58301" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_shares_news_feed" ("id" SERIAL NOT NULL, "shared_at" TIMESTAMP NOT NULL DEFAULT now(), "newsFeedNewsFeedId" integer, CONSTRAINT "PK_cf4b19f3df02abbe9451fde5ce3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_views_news_feed" ("id" SERIAL NOT NULL, "viewed_at" TIMESTAMP NOT NULL DEFAULT now(), "newsFeedNewsFeedId" integer, CONSTRAINT "PK_653cc32154620b31cc51f6b1184" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reaction" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "reaction_id" SERIAL NOT NULL, "reaction_type" "public"."reaction_reaction_type_enum" NOT NULL, "reaction_image_url" character varying NOT NULL, CONSTRAINT "PK_e9807227100a65201ee75f09cd9" PRIMARY KEY ("reaction_id"))`);
        await queryRunner.query(`CREATE TABLE "user_reacts_news_feed" ("id" SERIAL NOT NULL, "newsFeedNewsFeedId" integer, "reactionReactionId" integer, CONSTRAINT "PK_afc71f551bd0712dc794b515790" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "story" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "story_url" character varying NOT NULL, "duration" integer NOT NULL, "newsFeedNewsFeedId" integer, CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "post_attachment" character varying NOT NULL, "newsFeedNewsFeedId" integer, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "live_stream_history" ("id" SERIAL NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "stream_url" character varying NOT NULL, "newsFeedNewsFeedId" integer, CONSTRAINT "PK_2d52bb9eb3976f3c609e3da86ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "news_feed" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "news_feed_id" SERIAL NOT NULL, "description" text, "visibility" "public"."news_feed_visibility_enum" NOT NULL DEFAULT 'public', CONSTRAINT "PK_4d050c766c45bc572ac5c21cf2e" PRIMARY KEY ("news_feed_id"))`);
        await queryRunner.query(`ALTER TABLE "user_has_news_feed" ADD CONSTRAINT "FK_d87dc7629f343cfc687c9622b70" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_comments_news_feed" ADD CONSTRAINT "FK_4fd8fc51418406f536a09a4b2f3" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_shares_news_feed" ADD CONSTRAINT "FK_dd8b9945e572a79bbbc460baa6b" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_views_news_feed" ADD CONSTRAINT "FK_f391b4b37685a30b491fd5f7f69" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_reacts_news_feed" ADD CONSTRAINT "FK_53098d0f612801b7c918ebbad59" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_reacts_news_feed" ADD CONSTRAINT "FK_b54e90c27f24f8d5f8e4597db8e" FOREIGN KEY ("reactionReactionId") REFERENCES "reaction"("reaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reel" ADD CONSTRAINT "FK_a8dc09f343b35caf93a3e0e5bf4" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story" ADD CONSTRAINT "FK_1f05d58a62bb6d267f31865f26b" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_3d2cd9ddeee131dfce912607d04" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "live_stream_history" ADD CONSTRAINT "FK_58cacd181e93805645a8d55c348" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "advertisement" ADD CONSTRAINT "FK_04ada5174c43a473103209cbdd3" FOREIGN KEY ("newsFeedNewsFeedId") REFERENCES "news_feed"("news_feed_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "advertisement" DROP CONSTRAINT "FK_04ada5174c43a473103209cbdd3"`);
        await queryRunner.query(`ALTER TABLE "live_stream_history" DROP CONSTRAINT "FK_58cacd181e93805645a8d55c348"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_3d2cd9ddeee131dfce912607d04"`);
        await queryRunner.query(`ALTER TABLE "story" DROP CONSTRAINT "FK_1f05d58a62bb6d267f31865f26b"`);
        await queryRunner.query(`ALTER TABLE "reel" DROP CONSTRAINT "FK_a8dc09f343b35caf93a3e0e5bf4"`);
        await queryRunner.query(`ALTER TABLE "user_reacts_news_feed" DROP CONSTRAINT "FK_b54e90c27f24f8d5f8e4597db8e"`);
        await queryRunner.query(`ALTER TABLE "user_reacts_news_feed" DROP CONSTRAINT "FK_53098d0f612801b7c918ebbad59"`);
        await queryRunner.query(`ALTER TABLE "user_views_news_feed" DROP CONSTRAINT "FK_f391b4b37685a30b491fd5f7f69"`);
        await queryRunner.query(`ALTER TABLE "user_shares_news_feed" DROP CONSTRAINT "FK_dd8b9945e572a79bbbc460baa6b"`);
        await queryRunner.query(`ALTER TABLE "user_comments_news_feed" DROP CONSTRAINT "FK_4fd8fc51418406f536a09a4b2f3"`);
        await queryRunner.query(`ALTER TABLE "user_has_news_feed" DROP CONSTRAINT "FK_d87dc7629f343cfc687c9622b70"`);
        await queryRunner.query(`DROP TABLE "news_feed"`);
        await queryRunner.query(`DROP TABLE "live_stream_history"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "story"`);
        await queryRunner.query(`DROP TABLE "user_reacts_news_feed"`);
        await queryRunner.query(`DROP TABLE "reaction"`);
        await queryRunner.query(`DROP TABLE "user_views_news_feed"`);
        await queryRunner.query(`DROP TABLE "user_shares_news_feed"`);
        await queryRunner.query(`DROP TABLE "user_comments_news_feed"`);
    }

}
