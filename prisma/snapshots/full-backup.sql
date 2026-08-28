--
-- PostgreSQL database dump
--

\restrict 58uhjiXfdJiGOE1ilrMvGAxj40RmbiipRDSCDIPBpQzUI4BarDV6QOTLtE5065V

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS "user_roles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS "user_roles_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "role_permissions_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "role_permissions_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.reservations DROP CONSTRAINT IF EXISTS "reservations_roomId_fkey";
ALTER TABLE IF EXISTS ONLY public.reservations DROP CONSTRAINT IF EXISTS "reservations_customerId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."user_roles_userId_roleId_key";
DROP INDEX IF EXISTS public.roles_name_key;
DROP INDEX IF EXISTS public."role_permissions_roleId_permissionId_key";
DROP INDEX IF EXISTS public.permissions_code_key;
DROP INDEX IF EXISTS public.media_assets_path_key;
DROP INDEX IF EXISTS public.media_assets_folder_idx;
DROP INDEX IF EXISTS public."media_assets_deletedAt_idx";
DROP INDEX IF EXISTS public.installations_slug_key;
DROP INDEX IF EXISTS public.customers_email_key;
DROP INDEX IF EXISTS public."content_sections_sectionName_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.reservations DROP CONSTRAINT IF EXISTS reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.reservations DROP CONSTRAINT IF EXISTS reservations_no_overlap;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.media_assets DROP CONSTRAINT IF EXISTS media_assets_pkey;
ALTER TABLE IF EXISTS ONLY public.installations DROP CONSTRAINT IF EXISTS installations_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.content_sections DROP CONSTRAINT IF EXISTS content_sections_pkey;
ALTER TABLE IF EXISTS ONLY public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rooms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reservations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.media_assets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.installations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.content_sections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contact_messages ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_roles_id_seq;
DROP TABLE IF EXISTS public.user_roles;
DROP SEQUENCE IF EXISTS public.rooms_id_seq;
DROP TABLE IF EXISTS public.rooms;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.role_permissions_id_seq;
DROP TABLE IF EXISTS public.role_permissions;
DROP SEQUENCE IF EXISTS public.reservations_id_seq;
DROP TABLE IF EXISTS public.reservations;
DROP SEQUENCE IF EXISTS public.permissions_id_seq;
DROP TABLE IF EXISTS public.permissions;
DROP SEQUENCE IF EXISTS public.media_assets_id_seq;
DROP TABLE IF EXISTS public.media_assets;
DROP SEQUENCE IF EXISTS public.installations_id_seq;
DROP TABLE IF EXISTS public.installations;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.content_sections_id_seq;
DROP TABLE IF EXISTS public.content_sections;
DROP SEQUENCE IF EXISTS public.contact_messages_id_seq;
DROP TABLE IF EXISTS public.contact_messages;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP EXTENSION IF EXISTS btree_gist;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text NOT NULL,
    status text DEFAULT 'pendiente'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    subject text,
    channel text DEFAULT 'email'::text NOT NULL
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: content_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_sections (
    id integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    title text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    data jsonb,
    banner text,
    images text[],
    "sectionName" text NOT NULL
);


--
-- Name: content_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_sections_id_seq OWNED BY public.content_sections.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    document text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: installations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.installations (
    id integer NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: installations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.installations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: installations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.installations_id_seq OWNED BY public.installations.id;


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id integer NOT NULL,
    filename text NOT NULL,
    path text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    "sizeBytes" integer NOT NULL,
    width integer,
    height integer,
    alt text,
    folder text DEFAULT 'general'::text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: media_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_assets_id_seq OWNED BY public.media_assets.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    code text NOT NULL,
    description text
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    "roomId" integer NOT NULL,
    "customerId" integer NOT NULL,
    "checkIn" timestamp(3) without time zone NOT NULL,
    "checkOut" timestamp(3) without time zone NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    status text DEFAULT 'PENDIENTE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    guests text,
    message text,
    "preferredTime" text,
    "dateRange" daterange GENERATED ALWAYS AS (daterange(("checkIn")::date, ("checkOut")::date, '[)'::text)) STORED
);


--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    capacity integer DEFAULT 2 NOT NULL,
    "pricePerNight" numeric(10,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "photoUrl" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    type text DEFAULT 'standard'::text NOT NULL
);


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: content_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_sections ALTER COLUMN id SET DEFAULT nextval('public.content_sections_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: installations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installations ALTER COLUMN id SET DEFAULT nextval('public.installations_id_seq'::regclass);


--
-- Name: media_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets ALTER COLUMN id SET DEFAULT nextval('public.media_assets_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e2e7dbe8-4256-4404-a538-84b39a0e2434	de3eb360ded2f7cc2acdaf9acf7ac7d95311baad10c76171096edd294e989ef9	2026-08-28 17:37:51.343134+00	20260812170628_create_contact_messages	\N	\N	2026-08-28 17:37:51.306935+00	1
60f4fb61-1049-416a-8c30-a341cc3aa028	102df1f6f532a76c87ef9a572da94e609eca0b75cc0451cc6e88e1283954e7cb	2026-08-28 17:37:52.35863+00	20260828170000_contact_message_channel_subject	\N	\N	2026-08-28 17:37:52.34458+00	1
77c4f707-7100-4f2b-9253-9f42f055d723	0107c316643e69409b9f07f1751d6a7fb9800750bcb6874c52fa9863e7f65639	2026-08-28 17:37:51.397491+00	20260813145406_create_users	\N	\N	2026-08-28 17:37:51.348044+00	1
9bd28c27-6633-4528-9a35-682c5cdb3c5f	af437ab30cb4f18d987ef249a19e0c37e86c7a3568fffa00686fb2ca8f1ecf6b	2026-08-28 17:37:51.594066+00	20260813164114_create_roles_and_permissions	\N	\N	2026-08-28 17:37:51.404097+00	1
41034fbf-e41b-49ce-adf4-95d625dcb818	596ffb062578b1f148399b5ffdfa75f1105cbd8354bdc7547a5d484b89ed2153	2026-08-28 17:37:51.659223+00	20260813180853_create_installations	\N	\N	2026-08-28 17:37:51.602773+00	1
95ef7fa1-5eea-4482-b376-6c52720806a1	8743dc063ebbf5bac7c0dc1b23f2c6a576c2de00a712c2786676019d1f40949b	2026-08-28 17:37:52.3749+00	20260828180000_content_section_data	\N	\N	2026-08-28 17:37:52.363029+00	1
316e21cb-5217-4460-8309-b5eaa694c01b	373cc0de653c99daa0a01003e122fc331abed935d67e77f1704d5e5f47983fc8	2026-08-28 17:37:51.798006+00	20260819141325_init_rooms_and_cms	\N	\N	2026-08-28 17:37:51.663981+00	1
cfa1a837-6f79-49ed-a8ab-1001b9c2b5c9	c55dd70c8c2cddfd7b47633a304d4cc201fbd4093a7db5c98ab559726f3fe994	2026-08-28 17:37:51.816608+00	20260819143741_add_room_fields	\N	\N	2026-08-28 17:37:51.802046+00	1
ec349141-e1ed-4381-a8ef-7bd2efe028d0	616c033707beaf216c375b5f92fc4aea41445dc6bf68d443b47e827f20f15ac4	2026-08-28 17:37:51.843397+00	20260820120000_normalize_statuses	\N	\N	2026-08-28 17:37:51.820576+00	1
6fbfafe2-1635-4573-9e3e-b6148b6bde44	711fc6201810621c2f53e2b48146ebc4dc6df364438ebc07e5fab9c493c7db4f	2026-08-28 17:37:51.918059+00	20260820170000_simplify_content_sections	\N	\N	2026-08-28 17:37:51.849537+00	1
b723e165-9a81-4ffb-9e52-f3bb93085370	cf138f485e436d8fe108c699e1ea09fecc655f019423af40390529c2f1fd3fa2	2026-08-28 17:37:51.937627+00	20260824000000_remove_legacy_user_role_field	\N	\N	2026-08-28 17:37:51.922692+00	1
ba51747e-a810-4861-a1e3-e1dc57594223	cb07d076bd8adf13cb5b1dd159939e19781b6162950fd3d4440e30678c8db26a	2026-08-28 17:37:52.232757+00	20260825140000_reservation_no_overlap_constraint	\N	\N	2026-08-28 17:37:51.941746+00	1
0c872c2b-ed13-4ca7-8b63-154036be9104	7bcacd4415ac3ac191e3e58d05170dbfc70ef068d73004edf118b221f2e091fd	2026-08-28 17:51:39.606363+00	20260828190000_restore_reservation_overlap	\N	\N	2026-08-28 17:51:39.545639+00	1
4171d771-cae1-43a4-af84-ac633c723fc8	7f06e82203cea8b99519d986c9b9e40c7b84b9f45e3302278bfce7f2ca2ffc92	2026-08-28 17:37:52.257072+00	20260826150000_add_reservation_guest_details	\N	\N	2026-08-28 17:37:52.237007+00	1
b7d0cc1e-65bc-4055-955a-5417f149f6a1	4735987207e889dc74ce717152bd5d8f6d80a0cf715e2c6881a6f23051fe0c0f	2026-08-28 17:37:52.320824+00	20260827180000_create_media_assets	\N	\N	2026-08-28 17:37:52.26375+00	1
5a7a818a-d1a5-4a2b-9e8e-6ed74792e3b5	46889851d4992e63f94bcd45f3862e77d9409e79d94f64702d648ea98d182ce6	2026-08-28 17:37:52.340398+00	20260828160000_reservation_overlap_ignores_completed	\N	\N	2026-08-28 17:37:52.324724+00	1
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, name, email, phone, message, status, "createdAt", "updatedAt", subject, channel) FROM stdin;
3	Alexis Patiño	admin@byd.com	7418529630	Asunto: soporte	leido	2026-08-27 12:00:00	2026-08-28 18:30:23.633	\N	email
5	Carla Mendoza	carla.mendoza@example.com	0991112233	Hola, quisiera saber precios para una cabaña familiar en diciembre.	pendiente	2026-08-28 16:00:00	2026-08-28 18:30:23.633	consulta	whatsapp
\.


--
-- Data for Name: content_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_sections (id, "createdAt", "updatedAt", title, description, "isActive", data, banner, images, "sectionName") FROM stdin;
6	2026-08-28 18:30:23.633	2026-08-28 18:30:23.633	\N	\N	t	\N	\N	{/uploads/images-1787599149834-33111325.jpg,/uploads/images-1787599149836-541653909.jpg}	room-la-abuela-gallery
7	2026-08-28 18:30:23.633	2026-08-28 18:30:23.633	\N	\N	t	\N	\N	{/uploads/images-1787599159927-397503841.jpg}	room-los-chicos-gallery
8	2026-08-28 18:30:23.633	2026-08-28 18:30:23.633	\N	\N	t	\N	\N	{/uploads/images-1787599177053-175635906.jpg,/uploads/images-1787599177054-925390202.jpg,/uploads/images-1787599177057-819407114.jpg}	room-las-chicas-gallery
9	2026-08-28 18:30:23.633	2026-08-28 18:30:23.633	\N	\N	t	\N	\N	{/uploads/images-1787599195795-497996123.jpg,/uploads/images-1787599195797-758290699.jpg,/uploads/images-1787599195799-63720307.jpg}	room-los-primos-gallery
10	2026-08-28 18:30:23.633	2026-08-28 18:30:23.633	\N	\N	t	\N	\N	{/uploads/images-1787599649004-913940113.jpg,/uploads/images-1787599649005-7186208.jpg,/uploads/images-1787599649021-267831406.jpg,/uploads/images-1787599649029-747257468.jpg,/uploads/images-1787599649044-124799477.jpg}	room-los-invitados-gallery
18	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	Cada rincón guarda una historia.	Villa Ana María nació del amor y la memoria. Construida entre 1946 y 1952 por Luis Mario Polo Toral en honor a su pequeña hija Ana María, que falleció con apenas cuatro años y medio, la casa es un testimonio de devoción y ternura. Inspirada en una plumilla traída desde Francia, su estilo francés, combinado con materiales tradicionales españoles y cuencanos, refleja un legado lleno de emotividad. Desde sus primeros días, Villa Ana María fue un hogar cálido, lleno de vida y recuerdos imborrables, que hoy continúa su historia renovada.	t	\N	/uploads/cms-raiz-img_1.png	{}	nosotros-historia
19	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-raiz-img.webp	{}	nosotros-video
35	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-ggen-Galeria7.webp,/uploads/cms-ggen-Galeria1.webp,/uploads/cms-ggen-Galeria2.webp,/uploads/cms-ggen-Galeria3.webp,/uploads/cms-ggen-Galeria4.webp,/uploads/cms-ggen-Galeria5.webp}	galeria-principal
5	2026-08-28 18:03:58.728	2026-08-28 18:55:42.69	\N	\N	t	\N	/uploads/banner-1787593762960-23411138.webp	{}	nosotros-compromiso
1	2026-08-28 18:03:58.387	2026-08-28 19:08:16.807	Villa Ana Maria	Disfruta de una experiencia única en la vida	t	\N	/uploads/cms-home-Home1.webp	{}	home-hero-1
2	2026-08-28 18:03:58.479	2026-08-28 19:08:16.807	HABITACIONES CÓMODAS	Modernas instalaciones para el descanso perfecto	t	\N	/uploads/cms-home-Home2.webp	{}	home-hero-2
3	2026-08-28 18:03:58.561	2026-08-28 19:08:16.807	\N	En el corazón de Cuenca, Villa Ana María te ofrece una experiencia única llena de tradición, confort y atención personalizada. Ven a vivir la historia mientras disfrutas de un ambiente acogedor y moderno.	t	\N	\N	{}	home-intro
36	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-post0fb.webp	{}	galeria-post-1
48	2026-08-28 18:55:42.69	2026-08-28 18:55:42.69	\N	\N	t	\N	/uploads/images-1787599649029-747257468.jpg	{}	installation-pet-grooming
49	2026-08-28 18:55:42.69	2026-08-28 18:55:42.69	\N	\N	t	\N	/uploads/images-1787599649044-124799477.jpg	{}	installation-pet-spa
50	2026-08-28 18:55:42.69	2026-08-28 18:55:42.69	\N	\N	t	\N	/uploads/images-1787599809932-627887368.jpg	{}	installation-pet-menu
51	2026-08-28 18:55:42.69	2026-08-28 18:55:42.69	\N	\N	t	\N	/uploads/images-1787599809933-663242708.jpg	{}	installation-pet-bakery
55	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807	ING, Bernardo Polo	Ceo Aracno Group	t	\N	/uploads/cms-figma-img_3.webp	\N	home-author
45	2026-08-28 18:55:42.69	2026-08-28 19:08:16.807	\N	\N	t	\N	\N	{/uploads/cms-galpiz-pizzeria2.webp,/uploads/cms-galcav-Cavas1.webp,/uploads/cms-galseco-SecoCarne.webp}	home-servicios-gallery
46	2026-08-28 18:55:42.69	2026-08-28 19:08:16.807	\N	\N	t	\N	\N	{/uploads/cms-villac-VillaC1.webp,/uploads/cms-villac-VillaC2.webp,/uploads/cms-villac-VillaC3.webp,/uploads/cms-galraiz-galeriavillana_2galeria.webp}	home-carousel-gallery
59	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807	\N	\N	t	{"items": [{"date": "Mayo 11, 2025", "name": "Anthony", "text": "La limpieza y el ambiente tranquilo del lugar son perfectos.", "avatar": "/uploads/cms-perfiles-1.jpg", "rating": 4}, {"date": "Mayo 9, 2025", "name": "Danny", "text": "Se aprecia la tranquilidad del entorno y la calidad del servicio.", "avatar": "/uploads/cms-perfiles-5.jpg", "rating": 4}, {"date": "Mayo 3, 2025", "name": "Nathy", "text": "La calidad de la comida y el ambiente familiar del lugar.", "avatar": "/uploads/cms-perfiles-2.jpg", "rating": 4}, {"date": "Abril 28, 2025", "name": "Paco", "text": "Excelente atención al cliente y muy buen ambiente.", "avatar": "/uploads/cms-perfiles-3.jpg", "rating": 5}, {"date": "Abril 25, 2025", "name": "Vladi", "text": "Me gustó mucho la comida y el servicio rápido.", "avatar": "/uploads/cms-perfiles-4.jpg", "rating": 4}]}	\N	\N	home-testimonios
60	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807	\N	\N	t	{"items": [{"link": "/habitaciones", "label": "/uploads/cms-etiquetas-Hospederia.webp", "character": "/uploads/cms-figma-img_20.webp"}, {"link": "/restaurante", "label": "/uploads/cms-etiquetas-santoseco.webp", "character": "/uploads/cms-santos-img.webp"}, {"link": "/bobolon", "label": "/uploads/cms-etiquetas-bobol_n.webp", "character": "/uploads/cms-santos-bobolon.webp"}, {"link": "/pet", "label": "/uploads/cms-figma-img_12.webp", "character": "/uploads/cms-figma-img_15.webp"}, {"link": "/pizzeria", "label": "/uploads/cms-etiquetas-pizzeria.webp", "character": "/uploads/cms-figma-img_14.webp"}, {"link": "/contact", "label": "/uploads/cms-etiquetas-helados.webp", "character": "/uploads/cms-figma-img_19.webp"}, {"link": "/rooftop", "label": "/uploads/cms-etiquetas-rooftop.webp", "character": "/uploads/cms-figma-img_18.webp"}, {"link": "/parque", "label": "/uploads/cms-etiquetas-parqueinfantil.webp", "character": "/uploads/cms-figma-img_17.webp"}, {"link": "/cavas", "label": "/uploads/cms-etiquetas-cavas.webp", "character": "/uploads/cms-figma-img_16.webp"}]}	\N	\N	home-aliados
37	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-post1fb.webp	{}	galeria-post-2
38	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-post2fb.webp	{}	galeria-post-3
39	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postinst0.webp	{}	galeria-post-4
40	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postint1.webp	{}	galeria-post-5
41	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postinst2.webp	{}	galeria-post-6
42	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postik0.webp	{}	galeria-post-7
43	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postk1.webp	{}	galeria-post-8
44	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-gpost-postik3.webp	{}	galeria-post-9
73	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058	Nuestras Habitaciones	Espacios diseñados para el descanso perfecto, combinando la calidez de lo tradicional con la comodidad de instalaciones modernas.	t	\N	\N	\N	habitaciones-intro
47	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-ghab-Habitacion0.webp,/uploads/cms-ghab-Habitacion1.webp,/uploads/cms-ghab-Habitacion2.webp,/uploads/cms-ghab-Habitacion3.webp,/uploads/cms-ghab-Habitacion4.webp,/uploads/cms-ghab-Habitacion5.webp}	habitaciones-gallery
11	2026-08-28 18:30:23.633	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-cavas.webp	{}	installation-cavas-banner
4	2026-08-28 18:03:58.643	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-pizza.webp	{}	installation-pizzeria-banner
12	2026-08-28 18:30:23.633	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-cielo.webp	{}	installation-rooftop-banner
13	2026-08-28 18:30:23.633	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-parqueinfantil.webp	{}	installation-parque-banner
14	2026-08-28 18:30:23.633	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-santoseco.webp	{}	installation-santoseco-banner
31	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-zonapet.webp	{}	installation-pet-banner
33	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	/uploads/cms-portada-bobolon_Santoseco.webp	{}	installation-bobolon-banner
22	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gcavas-Cavas1.webp,/uploads/cms-gcavas-Cavas2.webp,/uploads/cms-gcavas-Cavas3.webp,/uploads/cms-gcavas-Cavas4.webp}	installation-cavas-gallery
24	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gpizza-pizzeria1.webp,/uploads/cms-gpizza-pizzeria2.webp,/uploads/cms-gpizza-pizzeria3.webp}	installation-pizzeria-gallery
26	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gcielo-cielo1.webp,/uploads/cms-gcielo-cielo2.webp,/uploads/cms-gcielo-cielo3.webp}	installation-rooftop-gallery
28	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-geden-Eden1.webp,/uploads/cms-geden-Eden2.webp,/uploads/cms-geden-Eden3.webp,/uploads/cms-geden-Eden4.webp}	installation-parque-gallery
30	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gseco-SecoCarne.webp,/uploads/cms-gseco-SecoChivo.webp,/uploads/cms-gseco-SecoChancho.webp}	installation-santoseco-gallery
32	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gpet-pet1.webp,/uploads/cms-gpet-pet2.webp,/uploads/cms-gpet-pet3.webp,/uploads/cms-gpetm-pet2.webp,/uploads/cms-gpetm-pet3.webp,/uploads/cms-gpetm-pet4.webp,/uploads/cms-gpetm-pet5.webp,/uploads/cms-gpetm-pet6.webp,/uploads/cms-gpetm-pet7.webp,/uploads/cms-gpetm-pet8.webp}	installation-pet-gallery
34	2026-08-28 18:55:42.69	2026-08-28 19:14:47.058	\N	\N	t	\N	\N	{/uploads/cms-gbob-1.webp,/uploads/cms-gbob-2.webp,/uploads/cms-gbob-3.webp,/uploads/cms-gbob-4.webp,/uploads/cms-gbob-5.webp,/uploads/cms-gbob-6.webp,/uploads/cms-gbob-7.webp,/uploads/cms-gbob-8.webp,/uploads/cms-gbob-9.webp,/uploads/cms-gbob-10.webp,/uploads/cms-gbob-11.webp,/uploads/cms-gbob-12.webp,/uploads/cms-gbob-13.webp,/uploads/cms-gbob-14.webp,/uploads/cms-gbob-15.webp,/uploads/cms-gbob-16.webp,/uploads/cms-gbob-17.webp,/uploads/cms-gbob-18.webp,/uploads/cms-gbob-19.webp,/uploads/cms-gbob-20.webp}	installation-bobolon-gallery
90	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058	Panamericana Norte Km 12 1/2 - Challuabamba - Cuenca - Ecuador	comercial@grupoanamaria.com	t	\N	\N	\N	footer-info
58	2026-08-28 19:08:16.807	2026-08-28 19:18:58.811	\N	\N	t	{"items": [{"name": "Personaje 1", "cursor": "", "figure": "/uploads/cms-carousel-img.webp"}, {"name": "Personaje 2", "cursor": "", "figure": "/uploads/cms-carousel-img_1.webp"}, {"name": "Personaje 3", "cursor": "/uploads/cms-santos-Santopollo.webp", "figure": "/uploads/cms-carousel-img_2.webp"}, {"name": "Personaje 4", "cursor": "", "figure": "/uploads/cms-carousel-img_3.webp"}, {"name": "Personaje 5", "cursor": "", "figure": "/uploads/cms-carousel-img_4.webp"}, {"name": "Personaje 6", "cursor": "", "figure": "/uploads/cms-carousel-img_5.webp"}, {"name": "Personaje 7", "cursor": "", "figure": "/uploads/cms-carousel-img_6.webp"}, {"name": "Personaje 8", "cursor": "", "figure": "/uploads/cms-carousel-img_7.webp"}, {"name": "Personaje 9", "cursor": "", "figure": "/uploads/cms-carousel-img_8.webp"}]}	\N	\N	home-personajes
89	2026-08-28 19:14:47.058	2026-08-28 19:18:58.811	\N	\N	t	{"items": [{"name": "Mandamiento 1", "cursor": "", "figure": "/uploads/cms-santos-mandamiento1.webp"}, {"name": "Mandamiento 2", "cursor": "", "figure": "/uploads/cms-santos-mandamiento2.webp"}, {"name": "Mandamiento 3", "cursor": "", "figure": "/uploads/cms-santos-mandamiento3.webp"}, {"name": "Mandamiento 4", "cursor": "", "figure": "/uploads/cms-santos-mandamiento4.webp"}, {"name": "Mandamiento 5", "cursor": "", "figure": "/uploads/cms-santos-mandamiento5.webp"}, {"name": "Mandamiento 6", "cursor": "", "figure": "/uploads/cms-santos-mandamiento6.webp"}, {"name": "Mandamiento 7", "cursor": "/uploads/cms-santos-Santopollo.webp", "figure": "/uploads/cms-santos-mandamiento7.webp"}, {"name": "Mandamiento 8", "cursor": "", "figure": "/uploads/cms-santos-mandamiento8.webp"}, {"name": "Mandamiento 9", "cursor": "", "figure": "/uploads/cms-santos-mandamiento9.webp"}, {"name": "Mandamiento 10", "cursor": "", "figure": "/uploads/cms-santos-mandamiento10.webp"}]}	\N	\N	santoseco-mandamientos
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, "firstName", "lastName", email, phone, document, "createdAt", "updatedAt") FROM stdin;
14	Alexito	Patiño	prueba3@gmail.com	+593984461622	\N	2026-08-27 16:44:41	2026-08-28 18:30:23.633
19	Alexis	Patiño	prueba4@gmail.com	+593123456789	\N	2026-08-28 15:18:17	2026-08-28 18:30:23.633
\.


--
-- Data for Name: installations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.installations (id, slug, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_assets (id, filename, path, "originalName", "mimeType", "sizeBytes", width, height, alt, folder, "deletedAt", "createdAt", "updatedAt") FROM stdin;
75	cms-home-Home1.webp	/uploads/cms-home-Home1.webp	Home1.webp	image/webp	128970	\N	\N	Home1	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
76	cms-home-Home2.webp	/uploads/cms-home-Home2.webp	Home2.webp	image/webp	214774	\N	\N	Home2	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
77	cms-figma-img_3.webp	/uploads/cms-figma-img_3.webp	img_3.webp	image/webp	9302	\N	\N	img 3	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
78	cms-galpiz-pizzeria2.webp	/uploads/cms-galpiz-pizzeria2.webp	pizzeria2.webp	image/webp	152596	\N	\N	pizzeria2	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
79	cms-galcav-Cavas1.webp	/uploads/cms-galcav-Cavas1.webp	Cavas1.webp	image/webp	260046	\N	\N	Cavas1	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
80	cms-galseco-SecoCarne.webp	/uploads/cms-galseco-SecoCarne.webp	SecoCarne.webp	image/webp	161936	\N	\N	SecoCarne	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
81	cms-villac-VillaC1.webp	/uploads/cms-villac-VillaC1.webp	VillaC1.webp	image/webp	79260	\N	\N	VillaC1	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
82	cms-villac-VillaC2.webp	/uploads/cms-villac-VillaC2.webp	VillaC2.webp	image/webp	119162	\N	\N	VillaC2	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
83	cms-villac-VillaC3.webp	/uploads/cms-villac-VillaC3.webp	VillaC3.webp	image/webp	63982	\N	\N	VillaC3	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
84	cms-galraiz-galeriavillana_2galeria.webp	/uploads/cms-galraiz-galeriavillana_2galeria.webp	galeriavillana_2galeria.webp	image/webp	58664	\N	\N	galeriavillana 2galeria	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
85	cms-carousel-img.webp	/uploads/cms-carousel-img.webp	img.webp	image/webp	18550	\N	\N	img	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
87	cms-carousel-img_1.webp	/uploads/cms-carousel-img_1.webp	img_1.webp	image/webp	19442	\N	\N	img 1	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
89	cms-carousel-img_2.webp	/uploads/cms-carousel-img_2.webp	img_2.webp	image/webp	21354	\N	\N	img 2	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
91	cms-carousel-img_3.webp	/uploads/cms-carousel-img_3.webp	img_3.webp	image/webp	17296	\N	\N	img 3	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
93	cms-carousel-img_4.webp	/uploads/cms-carousel-img_4.webp	img_4.webp	image/webp	15046	\N	\N	img 4	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
95	cms-carousel-img_5.webp	/uploads/cms-carousel-img_5.webp	img_5.webp	image/webp	20574	\N	\N	img 5	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
97	cms-carousel-img_6.webp	/uploads/cms-carousel-img_6.webp	img_6.webp	image/webp	20356	\N	\N	img 6	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
99	cms-carousel-img_7.webp	/uploads/cms-carousel-img_7.webp	img_7.webp	image/webp	25184	\N	\N	img 7	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
101	cms-carousel-img_8.webp	/uploads/cms-carousel-img_8.webp	img_8.webp	image/webp	14458	\N	\N	img 8	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
103	cms-perfiles-1.jpg	/uploads/cms-perfiles-1.jpg	1.jpg	image/jpeg	4950	\N	\N	1	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
104	cms-perfiles-5.jpg	/uploads/cms-perfiles-5.jpg	5.jpg	image/jpeg	37473	\N	\N	5	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
105	cms-perfiles-2.jpg	/uploads/cms-perfiles-2.jpg	2.jpg	image/jpeg	13763	\N	\N	2	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
106	cms-perfiles-3.jpg	/uploads/cms-perfiles-3.jpg	3.jpg	image/jpeg	14591	\N	\N	3	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
1	banner-1787245782693-624375732.png	/uploads/banner-1787245782693-624375732.png	banner-1787245782693-624375732.png	image/png	150193	1163	739	\N	cavas	2026-08-28 19:25:32.949	2026-08-28 18:02:45.926	2026-08-28 19:25:32.953
6	banner-1787593762630-877362732.webp	/uploads/banner-1787593762630-877362732.webp	banner-1787593762630-877362732.webp	image/webp	325314	1920	1279	\N	nosotros	\N	2026-08-28 18:02:46.004	2026-08-28 18:02:46.004
5	banner-1787593762564-522031256.png	/uploads/banner-1787593762564-522031256.png	banner-1787593762564-522031256.png	image/png	216293	564	796	\N	nosotros	\N	2026-08-28 18:02:45.99	2026-08-28 18:02:45.99
12	banner-1787593762960-23411138.webp	/uploads/banner-1787593762960-23411138.webp	banner-1787593762960-23411138.webp	image/webp	104836	975	1002	\N	nosotros	\N	2026-08-28 18:02:46.081	2026-08-28 18:02:46.081
7	banner-1787593762723-314135457.webp	/uploads/banner-1787593762723-314135457.webp	banner-1787593762723-314135457.webp	image/webp	13782	296	447	\N	cavas	\N	2026-08-28 18:02:46.017	2026-08-28 18:02:46.017
8	banner-1787593762765-78554707.webp	/uploads/banner-1787593762765-78554707.webp	banner-1787593762765-78554707.webp	image/webp	36690	526	526	\N	cavas	\N	2026-08-28 18:02:46.031	2026-08-28 18:02:46.031
9	banner-1787593762817-698851819.webp	/uploads/banner-1787593762817-698851819.webp	banner-1787593762817-698851819.webp	image/webp	10632	378	389	\N	cavas	\N	2026-08-28 18:02:46.044	2026-08-28 18:02:46.044
10	banner-1787593762867-17656044.webp	/uploads/banner-1787593762867-17656044.webp	banner-1787593762867-17656044.webp	image/webp	39352	530	443	\N	pizzeria	\N	2026-08-28 18:02:46.057	2026-08-28 18:02:46.057
11	banner-1787593762908-854125193.webp	/uploads/banner-1787593762908-854125193.webp	banner-1787593762908-854125193.webp	image/webp	24990	472	391	\N	pizzeria	\N	2026-08-28 18:02:46.07	2026-08-28 18:02:46.07
13	banner-1787593762999-716455627.webp	/uploads/banner-1787593762999-716455627.webp	banner-1787593762999-716455627.webp	image/webp	114170	1280	1280	\N	pizzeria	\N	2026-08-28 18:02:46.094	2026-08-28 18:02:46.094
14	banner-1787593763077-170146179.webp	/uploads/banner-1787593763077-170146179.webp	banner-1787593763077-170146179.webp	image/webp	103518	1280	1280	\N	pizzeria	\N	2026-08-28 18:02:46.105	2026-08-28 18:02:46.105
15	banner-1787593763148-568570620.webp	/uploads/banner-1787593763148-568570620.webp	banner-1787593763148-568570620.webp	image/webp	53716	598	646	\N	rooftop	\N	2026-08-28 18:02:46.117	2026-08-28 18:02:46.117
22	banner-1787668564236-642865167.webp	/uploads/banner-1787668564236-642865167.webp	banner-1787668564236-642865167.webp	image/webp	162904	1200	1200	\N	rooftop	\N	2026-08-28 18:02:46.201	2026-08-28 18:02:46.201
21	banner-1787593911864-636159506.webp	/uploads/banner-1787593911864-636159506.webp	banner-1787593911864-636159506.webp	image/webp	145274	1920	856	\N	zona-pet	\N	2026-08-28 18:02:46.189	2026-08-28 18:02:46.189
107	cms-perfiles-4.jpg	/uploads/cms-perfiles-4.jpg	4.jpg	image/jpeg	20444	\N	\N	4	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
108	cms-etiquetas-Hospederia.webp	/uploads/cms-etiquetas-Hospederia.webp	Hospederia.webp	image/webp	5766	\N	\N	Hospederia	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
109	cms-figma-img_20.webp	/uploads/cms-figma-img_20.webp	img_20.webp	image/webp	15702	\N	\N	img 20	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
110	cms-etiquetas-santoseco.webp	/uploads/cms-etiquetas-santoseco.webp	santoseco.webp	image/webp	4694	\N	\N	santoseco	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
111	cms-santos-img.webp	/uploads/cms-santos-img.webp	img.webp	image/webp	10648	\N	\N	img	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
112	cms-etiquetas-bobol_n.webp	/uploads/cms-etiquetas-bobol_n.webp	bobolón.webp	image/webp	4074	\N	\N	bobolón	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
113	cms-santos-bobolon.webp	/uploads/cms-santos-bobolon.webp	bobolon.webp	image/webp	47734	\N	\N	bobolon	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
114	cms-figma-img_12.webp	/uploads/cms-figma-img_12.webp	img_12.webp	image/webp	13852	\N	\N	img 12	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
115	cms-figma-img_15.webp	/uploads/cms-figma-img_15.webp	img_15.webp	image/webp	12134	\N	\N	img 15	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
116	cms-etiquetas-pizzeria.webp	/uploads/cms-etiquetas-pizzeria.webp	pizzeria.webp	image/webp	4170	\N	\N	pizzeria	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
117	cms-figma-img_14.webp	/uploads/cms-figma-img_14.webp	img_14.webp	image/webp	22780	\N	\N	img 14	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
118	cms-etiquetas-helados.webp	/uploads/cms-etiquetas-helados.webp	helados.webp	image/webp	4844	\N	\N	helados	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
119	cms-figma-img_19.webp	/uploads/cms-figma-img_19.webp	img_19.webp	image/webp	7514	\N	\N	img 19	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
120	cms-etiquetas-rooftop.webp	/uploads/cms-etiquetas-rooftop.webp	rooftop.webp	image/webp	4248	\N	\N	rooftop	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
121	cms-figma-img_18.webp	/uploads/cms-figma-img_18.webp	img_18.webp	image/webp	4840	\N	\N	img 18	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
122	cms-etiquetas-parqueinfantil.webp	/uploads/cms-etiquetas-parqueinfantil.webp	parqueinfantil.webp	image/webp	4756	\N	\N	parqueinfantil	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
123	cms-figma-img_17.webp	/uploads/cms-figma-img_17.webp	img_17.webp	image/webp	15084	\N	\N	img 17	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
124	cms-etiquetas-cavas.webp	/uploads/cms-etiquetas-cavas.webp	cavas.webp	image/webp	4778	\N	\N	cavas	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
125	cms-figma-img_16.webp	/uploads/cms-figma-img_16.webp	img_16.webp	image/webp	15534	\N	\N	img 16	inicio	\N	2026-08-28 19:08:16.807	2026-08-28 19:08:16.807
2	banner-1787593762370-752896465.webp	/uploads/banner-1787593762370-752896465.webp	banner-1787593762370-752896465.webp	image/webp	128970	1920	955	\N	inicio	\N	2026-08-28 18:02:45.95	2026-08-28 18:02:45.95
3	banner-1787593762458-471790993.webp	/uploads/banner-1787593762458-471790993.webp	banner-1787593762458-471790993.webp	image/webp	214774	1920	955	\N	inicio	\N	2026-08-28 18:02:45.964	2026-08-28 18:02:45.964
4	banner-1787593762508-422337512.webp	/uploads/banner-1787593762508-422337512.webp	banner-1787593762508-422337512.webp	image/webp	9302	216	219	\N	inicio	\N	2026-08-28 18:02:45.977	2026-08-28 18:02:45.977
17	banner-1787593763445-159606317.webp	/uploads/banner-1787593763445-159606317.webp	banner-1787593763445-159606317.webp	image/webp	137004	1920	856	\N	pizzeria	\N	2026-08-28 18:02:46.141	2026-08-28 18:02:46.141
18	banner-1787593763543-213787962.webp	/uploads/banner-1787593763543-213787962.webp	banner-1787593763543-213787962.webp	image/webp	294128	1920	856	\N	rooftop	\N	2026-08-28 18:02:46.152	2026-08-28 18:02:46.152
16	banner-1787593763349-319018207.webp	/uploads/banner-1787593763349-319018207.webp	banner-1787593763349-319018207.webp	image/webp	259280	1920	856	\N	bobolon	\N	2026-08-28 18:02:46.129	2026-08-28 18:02:46.129
48	images-1787593952214-745110599.webp	/uploads/images-1787593952214-745110599.webp	images-1787593952214-745110599.webp	image/webp	221558	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.499	2026-08-28 18:02:46.499
49	images-1787593952217-533787577.webp	/uploads/images-1787593952217-533787577.webp	images-1787593952217-533787577.webp	image/webp	84222	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.51	2026-08-28 18:02:46.51
50	images-1787593952218-742188755.webp	/uploads/images-1787593952218-742188755.webp	images-1787593952218-742188755.webp	image/webp	263628	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.521	2026-08-28 18:02:46.521
51	images-1787593952222-460528763.webp	/uploads/images-1787593952222-460528763.webp	images-1787593952222-460528763.webp	image/webp	322452	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.533	2026-08-28 18:02:46.533
52	images-1787593952239-387212355.webp	/uploads/images-1787593952239-387212355.webp	images-1787593952239-387212355.webp	image/webp	226934	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.545	2026-08-28 18:02:46.545
53	images-1787593952243-152735614.webp	/uploads/images-1787593952243-152735614.webp	images-1787593952243-152735614.webp	image/webp	112182	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.555	2026-08-28 18:02:46.555
54	images-1787593952246-130657005.webp	/uploads/images-1787593952246-130657005.webp	images-1787593952246-130657005.webp	image/webp	199142	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.566	2026-08-28 18:02:46.566
55	images-1787593952261-218538058.webp	/uploads/images-1787593952261-218538058.webp	images-1787593952261-218538058.webp	image/webp	80124	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.579	2026-08-28 18:02:46.579
56	images-1787593952261-56530003.webp	/uploads/images-1787593952261-56530003.webp	images-1787593952261-56530003.webp	image/webp	64020	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.59	2026-08-28 18:02:46.59
57	images-1787593952262-827585210.webp	/uploads/images-1787593952262-827585210.webp	images-1787593952262-827585210.webp	image/webp	169550	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.602	2026-08-28 18:02:46.602
67	images-1787599203201-629581982.jpg	/uploads/images-1787599203201-629581982.jpg	images-1787599203201-629581982.jpg	image/jpeg	82376	1200	805	\N	habitaciones	\N	2026-08-28 18:02:46.711	2026-08-28 18:02:46.711
126	cms-raiz-img_1.png	/uploads/cms-raiz-img_1.png	img_1.png	image/png	216293	\N	\N	img 1	nosotros	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
127	cms-raiz-img.webp	/uploads/cms-raiz-img.webp	img.webp	image/webp	325314	\N	\N	img	nosotros	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
128	cms-ggen-Galeria7.webp	/uploads/cms-ggen-Galeria7.webp	Galeria7.webp	image/webp	150818	\N	\N	Galeria7	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
129	cms-ggen-Galeria1.webp	/uploads/cms-ggen-Galeria1.webp	Galeria1.webp	image/webp	203396	\N	\N	Galeria1	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
130	cms-ggen-Galeria2.webp	/uploads/cms-ggen-Galeria2.webp	Galeria2.webp	image/webp	172990	\N	\N	Galeria2	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
131	cms-ggen-Galeria3.webp	/uploads/cms-ggen-Galeria3.webp	Galeria3.webp	image/webp	227320	\N	\N	Galeria3	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
132	cms-ggen-Galeria4.webp	/uploads/cms-ggen-Galeria4.webp	Galeria4.webp	image/webp	118744	\N	\N	Galeria4	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
133	cms-ggen-Galeria5.webp	/uploads/cms-ggen-Galeria5.webp	Galeria5.webp	image/webp	242830	\N	\N	Galeria5	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
134	cms-gpost-post0fb.webp	/uploads/cms-gpost-post0fb.webp	post0fb.webp	image/webp	13782	\N	\N	post0fb	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
135	cms-gpost-post1fb.webp	/uploads/cms-gpost-post1fb.webp	post1fb.webp	image/webp	36690	\N	\N	post1fb	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
136	cms-gpost-post2fb.webp	/uploads/cms-gpost-post2fb.webp	post2fb.webp	image/webp	10632	\N	\N	post2fb	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
137	cms-gpost-postinst0.webp	/uploads/cms-gpost-postinst0.webp	postinst0.webp	image/webp	39352	\N	\N	postinst0	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
138	cms-gpost-postint1.webp	/uploads/cms-gpost-postint1.webp	postint1.webp	image/webp	24990	\N	\N	postint1	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
139	cms-gpost-postinst2.webp	/uploads/cms-gpost-postinst2.webp	postinst2.webp	image/webp	104836	\N	\N	postinst2	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
140	cms-gpost-postik0.webp	/uploads/cms-gpost-postik0.webp	postik0.webp	image/webp	114170	\N	\N	postik0	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
141	cms-gpost-postk1.webp	/uploads/cms-gpost-postk1.webp	postk1.webp	image/webp	103518	\N	\N	postk1	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
142	cms-gpost-postik3.webp	/uploads/cms-gpost-postik3.webp	postik3.webp	image/webp	53716	\N	\N	postik3	galeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
143	cms-ghab-Habitacion0.webp	/uploads/cms-ghab-Habitacion0.webp	Habitacion0.webp	image/webp	116054	\N	\N	Habitacion0	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
144	cms-ghab-Habitacion1.webp	/uploads/cms-ghab-Habitacion1.webp	Habitacion1.webp	image/webp	117688	\N	\N	Habitacion1	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
145	cms-ghab-Habitacion2.webp	/uploads/cms-ghab-Habitacion2.webp	Habitacion2.webp	image/webp	129288	\N	\N	Habitacion2	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
146	cms-ghab-Habitacion3.webp	/uploads/cms-ghab-Habitacion3.webp	Habitacion3.webp	image/webp	147938	\N	\N	Habitacion3	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
147	cms-ghab-Habitacion4.webp	/uploads/cms-ghab-Habitacion4.webp	Habitacion4.webp	image/webp	136060	\N	\N	Habitacion4	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
148	cms-ghab-Habitacion5.webp	/uploads/cms-ghab-Habitacion5.webp	Habitacion5.webp	image/webp	135114	\N	\N	Habitacion5	habitaciones	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
149	cms-portada-cavas.webp	/uploads/cms-portada-cavas.webp	cavas.webp	image/webp	134410	\N	\N	cavas	cavas	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
150	cms-portada-pizza.webp	/uploads/cms-portada-pizza.webp	pizza.webp	image/webp	259280	\N	\N	pizza	pizzeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
151	cms-portada-cielo.webp	/uploads/cms-portada-cielo.webp	cielo.webp	image/webp	137004	\N	\N	cielo	rooftop	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
152	cms-portada-parqueinfantil.webp	/uploads/cms-portada-parqueinfantil.webp	parqueinfantil.webp	image/webp	294128	\N	\N	parqueinfantil	parque	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
153	cms-portada-santoseco.webp	/uploads/cms-portada-santoseco.webp	santoseco.webp	image/webp	250490	\N	\N	santoseco	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
154	cms-portada-zonapet.webp	/uploads/cms-portada-zonapet.webp	zonapet.webp	image/webp	215112	\N	\N	zonapet	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
155	cms-portada-bobolon_Santoseco.webp	/uploads/cms-portada-bobolon_Santoseco.webp	bobolon_Santoseco.webp	image/webp	145274	\N	\N	bobolon Santoseco	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
156	cms-gcavas-Cavas1.webp	/uploads/cms-gcavas-Cavas1.webp	Cavas1.webp	image/webp	260046	\N	\N	Cavas1	cavas	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
157	cms-gcavas-Cavas2.webp	/uploads/cms-gcavas-Cavas2.webp	Cavas2.webp	image/webp	213988	\N	\N	Cavas2	cavas	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
158	cms-gcavas-Cavas3.webp	/uploads/cms-gcavas-Cavas3.webp	Cavas3.webp	image/webp	162904	\N	\N	Cavas3	cavas	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
159	cms-gcavas-Cavas4.webp	/uploads/cms-gcavas-Cavas4.webp	Cavas4.webp	image/webp	290166	\N	\N	Cavas4	cavas	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
160	cms-gpizza-pizzeria1.webp	/uploads/cms-gpizza-pizzeria1.webp	pizzeria1.webp	image/webp	201814	\N	\N	pizzeria1	pizzeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
161	cms-gpizza-pizzeria2.webp	/uploads/cms-gpizza-pizzeria2.webp	pizzeria2.webp	image/webp	152596	\N	\N	pizzeria2	pizzeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
162	cms-gpizza-pizzeria3.webp	/uploads/cms-gpizza-pizzeria3.webp	pizzeria3.webp	image/webp	188568	\N	\N	pizzeria3	pizzeria	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
163	cms-gcielo-cielo1.webp	/uploads/cms-gcielo-cielo1.webp	cielo1.webp	image/webp	193652	\N	\N	cielo1	rooftop	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
164	cms-gcielo-cielo2.webp	/uploads/cms-gcielo-cielo2.webp	cielo2.webp	image/webp	275694	\N	\N	cielo2	rooftop	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
165	cms-gcielo-cielo3.webp	/uploads/cms-gcielo-cielo3.webp	cielo3.webp	image/webp	193606	\N	\N	cielo3	rooftop	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
166	cms-geden-Eden1.webp	/uploads/cms-geden-Eden1.webp	Eden1.webp	image/webp	287080	\N	\N	Eden1	parque	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
167	cms-geden-Eden2.webp	/uploads/cms-geden-Eden2.webp	Eden2.webp	image/webp	280562	\N	\N	Eden2	parque	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
168	cms-geden-Eden3.webp	/uploads/cms-geden-Eden3.webp	Eden3.webp	image/webp	269262	\N	\N	Eden3	parque	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
169	cms-geden-Eden4.webp	/uploads/cms-geden-Eden4.webp	Eden4.webp	image/webp	325584	\N	\N	Eden4	parque	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
170	cms-gseco-SecoCarne.webp	/uploads/cms-gseco-SecoCarne.webp	SecoCarne.webp	image/webp	161936	\N	\N	SecoCarne	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
171	cms-gseco-SecoChivo.webp	/uploads/cms-gseco-SecoChivo.webp	SecoChivo.webp	image/webp	163462	\N	\N	SecoChivo	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
172	cms-gseco-SecoChancho.webp	/uploads/cms-gseco-SecoChancho.webp	SecoChancho.webp	image/webp	144918	\N	\N	SecoChancho	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
173	cms-gpet-pet1.webp	/uploads/cms-gpet-pet1.webp	pet1.webp	image/webp	249320	\N	\N	pet1	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
174	cms-gpet-pet2.webp	/uploads/cms-gpet-pet2.webp	pet2.webp	image/webp	236332	\N	\N	pet2	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
23	images-1787593763264-531409248.webp	/uploads/images-1787593763264-531409248.webp	images-1787593763264-531409248.webp	image/webp	162904	1200	1200	\N	rooftop	\N	2026-08-28 18:02:46.214	2026-08-28 18:02:46.214
24	images-1787593763266-412688239.webp	/uploads/images-1787593763266-412688239.webp	images-1787593763266-412688239.webp	image/webp	290166	1200	1200	\N	rooftop	\N	2026-08-28 18:02:46.227	2026-08-28 18:02:46.227
19	banner-1787593763646-857965713.webp	/uploads/banner-1787593763646-857965713.webp	banner-1787593763646-857965713.webp	image/webp	250490	1920	856	\N	parque	\N	2026-08-28 18:02:46.165	2026-08-28 18:02:46.165
25	images-1787593763395-829314103.webp	/uploads/images-1787593763395-829314103.webp	images-1787593763395-829314103.webp	image/webp	201814	1200	1200	\N	parque	\N	2026-08-28 18:02:46.241	2026-08-28 18:02:46.241
26	images-1787593763398-880169796.webp	/uploads/images-1787593763398-880169796.webp	images-1787593763398-880169796.webp	image/webp	152596	1200	1200	\N	parque	\N	2026-08-28 18:02:46.255	2026-08-28 18:02:46.255
27	images-1787593763401-115638156.webp	/uploads/images-1787593763401-115638156.webp	images-1787593763401-115638156.webp	image/webp	188568	1200	1200	\N	parque	\N	2026-08-28 18:02:46.267	2026-08-28 18:02:46.267
28	images-1787593763483-932797415.webp	/uploads/images-1787593763483-932797415.webp	images-1787593763483-932797415.webp	image/webp	193652	1200	1200	\N	parque	\N	2026-08-28 18:02:46.28	2026-08-28 18:02:46.28
20	banner-1787593763735-520125283.webp	/uploads/banner-1787593763735-520125283.webp	banner-1787593763735-520125283.webp	image/webp	215112	1920	856	\N	santo-seco	\N	2026-08-28 18:02:46.178	2026-08-28 18:02:46.178
29	images-1787593763486-896046536.webp	/uploads/images-1787593763486-896046536.webp	images-1787593763486-896046536.webp	image/webp	275694	1200	1200	\N	santo-seco	\N	2026-08-28 18:02:46.291	2026-08-28 18:02:46.291
30	images-1787593763491-734335624.webp	/uploads/images-1787593763491-734335624.webp	images-1787593763491-734335624.webp	image/webp	193606	1200	1200	\N	santo-seco	\N	2026-08-28 18:02:46.302	2026-08-28 18:02:46.302
31	images-1787593763594-802464873.webp	/uploads/images-1787593763594-802464873.webp	images-1787593763594-802464873.webp	image/webp	287080	1200	1200	\N	santo-seco	\N	2026-08-28 18:02:46.313	2026-08-28 18:02:46.313
32	images-1787593763601-959815747.webp	/uploads/images-1787593763601-959815747.webp	images-1787593763601-959815747.webp	image/webp	280562	1200	1200	\N	santo-seco	\N	2026-08-28 18:02:46.324	2026-08-28 18:02:46.324
33	images-1787593763604-150335684.webp	/uploads/images-1787593763604-150335684.webp	images-1787593763604-150335684.webp	image/webp	269262	1200	1200	\N	zona-pet	\N	2026-08-28 18:02:46.335	2026-08-28 18:02:46.335
34	images-1787593763607-219905795.webp	/uploads/images-1787593763607-219905795.webp	images-1787593763607-219905795.webp	image/webp	325584	1200	1200	\N	zona-pet	\N	2026-08-28 18:02:46.346	2026-08-28 18:02:46.346
35	images-1787593763682-169184897.webp	/uploads/images-1787593763682-169184897.webp	images-1787593763682-169184897.webp	image/webp	161936	1080	1080	\N	zona-pet	\N	2026-08-28 18:02:46.358	2026-08-28 18:02:46.358
36	images-1787593763684-635856071.webp	/uploads/images-1787593763684-635856071.webp	images-1787593763684-635856071.webp	image/webp	163462	1080	1080	\N	zona-pet	\N	2026-08-28 18:02:46.37	2026-08-28 18:02:46.37
37	images-1787593763686-234941090.webp	/uploads/images-1787593763686-234941090.webp	images-1787593763686-234941090.webp	image/webp	144918	1080	1080	\N	bobolon	\N	2026-08-28 18:02:46.38	2026-08-28 18:02:46.38
38	images-1787593763787-217138238.webp	/uploads/images-1787593763787-217138238.webp	images-1787593763787-217138238.webp	image/webp	249320	1200	1200	\N	bobolon	\N	2026-08-28 18:02:46.392	2026-08-28 18:02:46.392
39	images-1787593763790-662052525.webp	/uploads/images-1787593763790-662052525.webp	images-1787593763790-662052525.webp	image/webp	236332	1200	1200	\N	bobolon	\N	2026-08-28 18:02:46.402	2026-08-28 18:02:46.402
40	images-1787593763796-169015492.webp	/uploads/images-1787593763796-169015492.webp	images-1787593763796-169015492.webp	image/webp	111308	1200	1200	\N	bobolon	\N	2026-08-28 18:02:46.412	2026-08-28 18:02:46.412
41	images-1787593763800-819839397.webp	/uploads/images-1787593763800-819839397.webp	images-1787593763800-819839397.webp	image/webp	57386	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.423	2026-08-28 18:02:46.423
42	images-1787593763801-934280406.webp	/uploads/images-1787593763801-934280406.webp	images-1787593763801-934280406.webp	image/webp	66756	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.434	2026-08-28 18:02:46.434
43	images-1787593763802-620860890.webp	/uploads/images-1787593763802-620860890.webp	images-1787593763802-620860890.webp	image/webp	102064	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.445	2026-08-28 18:02:46.445
44	images-1787593763802-819027893.webp	/uploads/images-1787593763802-819027893.webp	images-1787593763802-819027893.webp	image/webp	57686	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.456	2026-08-28 18:02:46.456
45	images-1787593763804-442264824.webp	/uploads/images-1787593763804-442264824.webp	images-1787593763804-442264824.webp	image/webp	58018	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.466	2026-08-28 18:02:46.466
46	images-1787593763817-105534310.webp	/uploads/images-1787593763817-105534310.webp	images-1787593763817-105534310.webp	image/webp	59440	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.477	2026-08-28 18:02:46.477
47	images-1787593763818-2910902.webp	/uploads/images-1787593763818-2910902.webp	images-1787593763818-2910902.webp	image/webp	53120	1200	1200	\N	galeria	\N	2026-08-28 18:02:46.488	2026-08-28 18:02:46.488
58	images-1787599149834-33111325.jpg	/uploads/images-1787599149834-33111325.jpg	images-1787599149834-33111325.jpg	image/jpeg	105498	1200	800	\N	inicio	\N	2026-08-28 18:02:46.613	2026-08-28 18:02:46.613
59	images-1787599149836-541653909.jpg	/uploads/images-1787599149836-541653909.jpg	images-1787599149836-541653909.jpg	image/jpeg	124195	800	1200	\N	inicio	\N	2026-08-28 18:02:46.623	2026-08-28 18:02:46.623
60	images-1787599159927-397503841.jpg	/uploads/images-1787599159927-397503841.jpg	images-1787599159927-397503841.jpg	image/jpeg	122312	1200	800	\N	inicio	\N	2026-08-28 18:02:46.633	2026-08-28 18:02:46.633
61	images-1787599177053-175635906.jpg	/uploads/images-1787599177053-175635906.jpg	images-1787599177053-175635906.jpg	image/jpeg	128223	1200	800	\N	inicio	\N	2026-08-28 18:02:46.645	2026-08-28 18:02:46.645
62	images-1787599177054-925390202.jpg	/uploads/images-1787599177054-925390202.jpg	images-1787599177054-925390202.jpg	image/jpeg	110118	800	1200	\N	inicio	\N	2026-08-28 18:02:46.656	2026-08-28 18:02:46.656
63	images-1787599177057-819407114.jpg	/uploads/images-1787599177057-819407114.jpg	images-1787599177057-819407114.jpg	image/jpeg	130623	1200	800	\N	inicio	\N	2026-08-28 18:02:46.665	2026-08-28 18:02:46.665
64	images-1787599195795-497996123.jpg	/uploads/images-1787599195795-497996123.jpg	images-1787599195795-497996123.jpg	image/jpeg	144657	1200	800	\N	inicio	\N	2026-08-28 18:02:46.677	2026-08-28 18:02:46.677
65	images-1787599195797-758290699.jpg	/uploads/images-1787599195797-758290699.jpg	images-1787599195797-758290699.jpg	image/jpeg	112591	795	1200	\N	habitaciones	\N	2026-08-28 18:02:46.688	2026-08-28 18:02:46.688
175	cms-gpet-pet3.webp	/uploads/cms-gpet-pet3.webp	pet3.webp	image/webp	111308	\N	\N	pet3	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
176	cms-gpetm-pet2.webp	/uploads/cms-gpetm-pet2.webp	pet2.webp	image/webp	57386	\N	\N	pet2	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
177	cms-gpetm-pet3.webp	/uploads/cms-gpetm-pet3.webp	pet3.webp	image/webp	66756	\N	\N	pet3	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
178	cms-gpetm-pet4.webp	/uploads/cms-gpetm-pet4.webp	pet4.webp	image/webp	57686	\N	\N	pet4	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
179	cms-gpetm-pet5.webp	/uploads/cms-gpetm-pet5.webp	pet5.webp	image/webp	102064	\N	\N	pet5	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
180	cms-gpetm-pet6.webp	/uploads/cms-gpetm-pet6.webp	pet6.webp	image/webp	58018	\N	\N	pet6	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
66	images-1787599195799-63720307.jpg	/uploads/images-1787599195799-63720307.jpg	images-1787599195799-63720307.jpg	image/jpeg	133988	1200	800	\N	habitaciones	\N	2026-08-28 18:02:46.7	2026-08-28 18:02:46.7
68	images-1787599649004-913940113.jpg	/uploads/images-1787599649004-913940113.jpg	images-1787599649004-913940113.jpg	image/jpeg	122312	1200	800	\N	habitaciones	\N	2026-08-28 18:02:46.722	2026-08-28 18:02:46.722
69	images-1787599649005-7186208.jpg	/uploads/images-1787599649005-7186208.jpg	images-1787599649005-7186208.jpg	image/jpeg	131893	800	1200	\N	habitaciones	\N	2026-08-28 18:02:46.734	2026-08-28 18:02:46.734
70	images-1787599649021-267831406.jpg	/uploads/images-1787599649021-267831406.jpg	images-1787599649021-267831406.jpg	image/jpeg	100534	896	1200	\N	habitaciones	\N	2026-08-28 18:02:46.745	2026-08-28 18:02:46.745
71	images-1787599649029-747257468.jpg	/uploads/images-1787599649029-747257468.jpg	images-1787599649029-747257468.jpg	image/jpeg	178232	800	1200	\N	zona-pet	\N	2026-08-28 18:02:46.756	2026-08-28 18:02:46.756
72	images-1787599649044-124799477.jpg	/uploads/images-1787599649044-124799477.jpg	images-1787599649044-124799477.jpg	image/jpeg	193294	1200	825	\N	zona-pet	\N	2026-08-28 18:02:46.768	2026-08-28 18:02:46.768
73	images-1787599809932-627887368.jpg	/uploads/images-1787599809932-627887368.jpg	images-1787599809932-627887368.jpg	image/jpeg	82376	1200	805	\N	zona-pet	\N	2026-08-28 18:02:46.778	2026-08-28 18:02:46.778
74	images-1787599809933-663242708.jpg	/uploads/images-1787599809933-663242708.jpg	images-1787599809933-663242708.jpg	image/jpeg	117314	1200	800	\N	zona-pet	\N	2026-08-28 18:02:46.789	2026-08-28 18:02:46.789
181	cms-gpetm-pet7.webp	/uploads/cms-gpetm-pet7.webp	pet7.webp	image/webp	59440	\N	\N	pet7	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
182	cms-gpetm-pet8.webp	/uploads/cms-gpetm-pet8.webp	pet8.webp	image/webp	53120	\N	\N	pet8	zona-pet	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
183	cms-gbob-1.webp	/uploads/cms-gbob-1.webp	1.webp	image/webp	288740	\N	\N	1	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
184	cms-gbob-2.webp	/uploads/cms-gbob-2.webp	2.webp	image/webp	257932	\N	\N	2	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
185	cms-gbob-3.webp	/uploads/cms-gbob-3.webp	3.webp	image/webp	199212	\N	\N	3	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
186	cms-gbob-4.webp	/uploads/cms-gbob-4.webp	4.webp	image/webp	92656	\N	\N	4	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
187	cms-gbob-5.webp	/uploads/cms-gbob-5.webp	5.webp	image/webp	221558	\N	\N	5	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
188	cms-gbob-6.webp	/uploads/cms-gbob-6.webp	6.webp	image/webp	317094	\N	\N	6	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
189	cms-gbob-7.webp	/uploads/cms-gbob-7.webp	7.webp	image/webp	222022	\N	\N	7	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
190	cms-gbob-8.webp	/uploads/cms-gbob-8.webp	8.webp	image/webp	84222	\N	\N	8	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
191	cms-gbob-9.webp	/uploads/cms-gbob-9.webp	9.webp	image/webp	263628	\N	\N	9	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
192	cms-gbob-10.webp	/uploads/cms-gbob-10.webp	10.webp	image/webp	322452	\N	\N	10	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
193	cms-gbob-11.webp	/uploads/cms-gbob-11.webp	11.webp	image/webp	226934	\N	\N	11	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
194	cms-gbob-12.webp	/uploads/cms-gbob-12.webp	12.webp	image/webp	112182	\N	\N	12	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
195	cms-gbob-13.webp	/uploads/cms-gbob-13.webp	13.webp	image/webp	199142	\N	\N	13	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
196	cms-gbob-14.webp	/uploads/cms-gbob-14.webp	14.webp	image/webp	64020	\N	\N	14	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
197	cms-gbob-15.webp	/uploads/cms-gbob-15.webp	15.webp	image/webp	80124	\N	\N	15	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
198	cms-gbob-16.webp	/uploads/cms-gbob-16.webp	16.webp	image/webp	169550	\N	\N	16	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
199	cms-gbob-17.webp	/uploads/cms-gbob-17.webp	17.webp	image/webp	180142	\N	\N	17	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
200	cms-gbob-18.webp	/uploads/cms-gbob-18.webp	18.webp	image/webp	87688	\N	\N	18	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
201	cms-gbob-19.webp	/uploads/cms-gbob-19.webp	19.webp	image/webp	86820	\N	\N	19	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
202	cms-gbob-20.webp	/uploads/cms-gbob-20.webp	20.webp	image/webp	70384	\N	\N	20	bobolon	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
203	cms-santos-mandamiento1.webp	/uploads/cms-santos-mandamiento1.webp	mandamiento1.webp	image/webp	113140	\N	\N	mandamiento1	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
205	cms-santos-mandamiento2.webp	/uploads/cms-santos-mandamiento2.webp	mandamiento2.webp	image/webp	124996	\N	\N	mandamiento2	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
207	cms-santos-mandamiento3.webp	/uploads/cms-santos-mandamiento3.webp	mandamiento3.webp	image/webp	102624	\N	\N	mandamiento3	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
209	cms-santos-mandamiento4.webp	/uploads/cms-santos-mandamiento4.webp	mandamiento4.webp	image/webp	136740	\N	\N	mandamiento4	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
211	cms-santos-mandamiento5.webp	/uploads/cms-santos-mandamiento5.webp	mandamiento5.webp	image/webp	135820	\N	\N	mandamiento5	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
213	cms-santos-mandamiento6.webp	/uploads/cms-santos-mandamiento6.webp	mandamiento6.webp	image/webp	149202	\N	\N	mandamiento6	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
215	cms-santos-mandamiento7.webp	/uploads/cms-santos-mandamiento7.webp	mandamiento7.webp	image/webp	158370	\N	\N	mandamiento7	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
90	cms-santos-Santopollo.webp	/uploads/cms-santos-Santopollo.webp	Santopollo.webp	image/webp	2980	\N	\N	Santopollo	santo-seco	\N	2026-08-28 19:08:16.807	2026-08-28 19:14:47.058
217	cms-santos-mandamiento8.webp	/uploads/cms-santos-mandamiento8.webp	mandamiento8.webp	image/webp	131656	\N	\N	mandamiento8	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
219	cms-santos-mandamiento9.webp	/uploads/cms-santos-mandamiento9.webp	mandamiento9.webp	image/webp	140436	\N	\N	mandamiento9	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
221	cms-santos-mandamiento10.webp	/uploads/cms-santos-mandamiento10.webp	mandamiento10.webp	image/webp	141668	\N	\N	mandamiento10	santo-seco	\N	2026-08-28 19:14:47.058	2026-08-28 19:14:47.058
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, description) FROM stdin;
1	contact_messages:read	Read contact messages
2	contact_messages:update	Update contact messages status
3	installations:create	Create installations
4	installations:update	Update installations
5	installations:delete	Delete installations
6	rooms:create	Create rooms
7	rooms:update	Update rooms
8	reservations:read	Read reservations
9	reservations:update	Update reservations
10	reservations:delete	Delete reservations
11	content_sections:create	Create content sections
12	content_sections:update	Update content sections
13	content_sections:delete	Delete content sections
14	media:read	Read the media library
15	media:create	Upload files to the media library
16	media:update	Edit media metadata and restore from trash
17	media:delete	Send media assets to the trash
18	users:create	Register new admin users
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") FROM stdin;
13	1	19	2026-08-26 00:00:00	2026-08-27 00:00:00	120.00	CANCELADA	2026-08-25 19:24:55	2026-08-28 18:30:23.633	\N	\N	\N
14	1	19	2026-08-28 00:00:00	2026-08-29 00:00:00	120.00	CANCELADA	2026-08-25 19:31:05	2026-08-28 18:30:23.633	\N	\N	\N
48	5	14	2026-08-28 00:00:00	2026-09-01 00:00:00	600.00	CANCELADA	2026-08-27 16:44:41	2026-08-28 18:30:23.633	6+ personas	\N	00:00
49	1	14	2026-08-29 00:00:00	2026-08-31 00:00:00	240.00	CANCELADA	2026-08-28 13:50:01	2026-08-28 18:30:23.633	5 personas	\N	18:30
50	1	14	2026-08-29 00:00:00	2026-08-31 00:00:00	240.00	CANCELADA	2026-08-28 14:06:00	2026-08-28 18:30:23.633	5 personas	\N	18:30
55	2	19	2026-08-30 00:00:00	2026-08-31 00:00:00	180.00	CANCELADA	2026-08-28 15:18:17	2026-08-28 18:30:23.633	3 personas	\N	05:05
56	2	19	2026-08-29 00:00:00	2026-08-30 00:00:00	180.00	CANCELADA	2026-08-28 15:20:00	2026-08-28 18:30:23.633	1 persona	\N	00:00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId") FROM stdin;
1	1	1
2	1	2
3	1	3
4	1	4
5	1	5
6	1	6
7	1	7
8	1	8
9	1	9
10	1	10
11	1	11
12	1	12
13	1	13
14	1	14
15	1	15
16	1	16
17	1	17
18	1	18
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description) FROM stdin;
1	admin	System Administrator
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) FROM stdin;
5	La Abuela	Ambiente íntimo.	4	150.00	f	2026-08-28 17:46:30.268	2026-08-28 17:46:30.268	/uploads/images-1787599149834-33111325.jpg	inactive	FAMILIAR
1	Los Chicos	Con mucha tradición, el lugar predilecto.	4	120.00	t	2026-08-28 17:46:30.139	2026-08-28 17:46:30.139	/uploads/images-1787599159927-397503841.jpg	active	FAMILIAR
2	Las Chicas	Un lugar especial.	4	180.00	t	2026-08-28 17:46:30.236	2026-08-28 17:46:30.236	/uploads/images-1787599177053-175635906.jpg	active	FAMILIAR
3	Los Primos	Para familias grandes.	4	110.00	t	2026-08-28 17:46:30.248	2026-08-28 17:46:30.248	/uploads/images-1787599195795-497996123.jpg	active	FAMILIAR
4	Los Invitados	Habitación especial.	4	130.00	t	2026-08-28 17:46:30.258	2026-08-28 17:46:30.258	/uploads/images-1787599649004-913940113.jpg	active	FAMILIAR
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", "roleId") FROM stdin;
1	1	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	admin@villaanamaria.com	$2b$10$jkRKOZcbLA1hlq2Zb5HniuzxZ9qfGaGm1Q7aqcjN.TOVRI5cZLrW2	Administrador	t	2026-08-28 17:46:30.438	2026-08-28 17:46:30.438
\.


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 5, true);


--
-- Name: content_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.content_sections_id_seq', 90, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 19, true);


--
-- Name: installations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.installations_id_seq', 1, false);


--
-- Name: media_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_assets_id_seq', 222, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 18, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservations_id_seq', 56, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 18, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rooms_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: content_sections content_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_sections
    ADD CONSTRAINT content_sections_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: installations installations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installations
    ADD CONSTRAINT installations_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_no_overlap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_no_overlap EXCLUDE USING gist ("roomId" WITH =, "dateRange" WITH &&) WHERE ((status = ANY (ARRAY['PENDIENTE'::text, 'CONFIRMADA'::text])));


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: content_sections_sectionName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "content_sections_sectionName_key" ON public.content_sections USING btree ("sectionName");


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: installations_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX installations_slug_key ON public.installations USING btree (slug);


--
-- Name: media_assets_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "media_assets_deletedAt_idx" ON public.media_assets USING btree ("deletedAt");


--
-- Name: media_assets_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_folder_idx ON public.media_assets USING btree (folder);


--
-- Name: media_assets_path_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_assets_path_key ON public.media_assets USING btree (path);


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: user_roles_userId_roleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON public.user_roles USING btree ("userId", "roleId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: reservations reservations_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservations reservations_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 58uhjiXfdJiGOE1ilrMvGAxj40RmbiipRDSCDIPBpQzUI4BarDV6QOTLtE5065V

