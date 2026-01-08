CREATE TABLE IF NOT EXISTS "stars" (
	"user_id" text NOT NULL,
	"snippet_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stars_user_id_snippet_id_pk" PRIMARY KEY("user_id","snippet_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "snippets" ADD COLUMN "forked_from_id" text;--> statement-breakpoint
ALTER TABLE "snippets" ADD COLUMN "star_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "snippets" ADD COLUMN "fork_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stars" ADD CONSTRAINT "stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stars" ADD CONSTRAINT "stars_snippet_id_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."snippets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stars_user_id" ON "stars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stars_snippet_id" ON "stars" USING btree ("snippet_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_is_public" ON "snippets" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_star_count" ON "snippets" USING btree ("star_count");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");