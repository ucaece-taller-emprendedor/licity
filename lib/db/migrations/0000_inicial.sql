CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workId" text NOT NULL,
	"offerId" text NOT NULL,
	"contractorUserId" text NOT NULL,
	"clientUserId" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"awardedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "awards_workId_unique" UNIQUE("workId"),
	CONSTRAINT "awards_offerId_unique" UNIQUE("offerId")
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"userId" text NOT NULL,
	"companyName" text NOT NULL,
	"cuit" text,
	"city" text NOT NULL,
	"phone" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "contractor_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"userId" text NOT NULL,
	"displayName" text NOT NULL,
	"cuit" text NOT NULL,
	"specialty" text NOT NULL,
	"city" text NOT NULL,
	"coverageZone" text,
	"description" text,
	"phone" text,
	"yearsExperience" integer,
	"verificationStatus" text DEFAULT 'PENDING' NOT NULL,
	"rejectionReason" text,
	"verifiedAt" timestamp with time zone,
	"verifiedBy" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contractor_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"readAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workId" text NOT NULL,
	"contractorUserId" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text NOT NULL,
	"estimatedDays" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_workId_contractorUserId_unique" UNIQUE("workId","contractorUserId")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workId" text NOT NULL,
	"finalAmount" numeric(14, 2) NOT NULL,
	"commissionRate" numeric(6, 4) NOT NULL,
	"commissionAmount" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'PENDING_GATEWAY' NOT NULL,
	"providerRef" text,
	"completedAt" timestamp with time zone NOT NULL,
	"isDemo" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_workId_unique" UNIQUE("workId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'CLIENT' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"isDemo" boolean DEFAULT false NOT NULL,
	"needsRoleSelection" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"contractorUserId" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"snapshot" jsonb,
	"reason" text,
	"submittedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewedAt" timestamp with time zone,
	"reviewedBy" text
);
--> statement-breakpoint
CREATE TABLE "work_updates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workId" text NOT NULL,
	"authorUserId" text,
	"kind" text NOT NULL,
	"fromStatus" text,
	"toStatus" text,
	"progress" integer,
	"message" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"clientUserId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"city" text NOT NULL,
	"desiredStartDate" date,
	"estimatedDays" integer,
	"budgetEstimate" numeric(14, 2),
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"awardedAt" timestamp with time zone,
	"startedAt" timestamp with time zone,
	"contractorDoneAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"reportedAt" timestamp with time zone,
	"reportReason" text,
	"reportedBy" text,
	"cancelReason" text,
	"isDemo" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_workId_works_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_offerId_offers_id_fk" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_contractorUserId_user_id_fk" FOREIGN KEY ("contractorUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_clientUserId_user_id_fk" FOREIGN KEY ("clientUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_workId_works_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_contractorUserId_user_id_fk" FOREIGN KEY ("contractorUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workId_works_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_contractorUserId_user_id_fk" FOREIGN KEY ("contractorUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_updates" ADD CONSTRAINT "work_updates_workId_works_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_updates" ADD CONSTRAINT "work_updates_authorUserId_user_id_fk" FOREIGN KEY ("authorUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_clientUserId_user_id_fk" FOREIGN KEY ("clientUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_one_accepted_per_work" ON "offers" USING btree ("workId") WHERE status = 'ACCEPTED';--> statement-breakpoint
CREATE INDEX "offers_work_idx" ON "offers" USING btree ("workId");--> statement-breakpoint
CREATE INDEX "offers_contractor_idx" ON "offers" USING btree ("contractorUserId");--> statement-breakpoint
CREATE INDEX "verification_requests_status_idx" ON "verification_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_updates_work_idx" ON "work_updates" USING btree ("workId","createdAt");--> statement-breakpoint
CREATE INDEX "works_status_idx" ON "works" USING btree ("status");--> statement-breakpoint
CREATE INDEX "works_client_idx" ON "works" USING btree ("clientUserId");