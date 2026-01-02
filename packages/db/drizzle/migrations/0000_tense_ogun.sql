CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "snippets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"language" text NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"slug" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" text PRIMARY KEY NOT NULL,
	"snippet_id" text NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"language" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variables" (
	"id" text PRIMARY KEY NOT NULL,
	"snippet_id" text NOT NULL,
	"name" text NOT NULL,
	"default_value" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "snippets_tags" (
	"snippet_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "snippets_tags_snippet_id_tag_id_pk" PRIMARY KEY("snippet_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "snippets" ADD CONSTRAINT "snippets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_snippet_id_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."snippets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variables" ADD CONSTRAINT "variables_snippet_id_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."snippets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "snippets_tags" ADD CONSTRAINT "snippets_tags_snippet_id_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."snippets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "snippets_tags" ADD CONSTRAINT "snippets_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_user_id" ON "snippets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_language" ON "snippets" USING btree ("language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_created_at" ON "snippets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_updated_at" ON "snippets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_files_snippet_id" ON "files" USING btree ("snippet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_files_order" ON "files" USING btree ("snippet_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variables_snippet_id" ON "variables" USING btree ("snippet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_tags_snippet" ON "snippets_tags" USING btree ("snippet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snippets_tags_tag" ON "snippets_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tags_user_id" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tags_name" ON "tags" USING btree ("user_id","name");