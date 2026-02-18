CREATE TABLE "Category" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"categoryId" integer,
	"teacherId" integer
);
--> statement-breakpoint
CREATE TABLE "Student" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Student_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordHash" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Student_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Teacher" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Teacher_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordHash" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Teacher_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_teacherId_Teacher_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE no action ON UPDATE no action;