--
-- PostgreSQL database dump
--

\restrict k37wXHhxOasOFi6O8ejrduEOqirtAL4fOLTIzOZzhV2nUTxRCagBidorAIXLzah

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

--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.contact_messages (id, name, email, phone, message, status, "createdAt", "updatedAt", subject, channel) VALUES (3, 'Alexis Patiño', 'admin@byd.com', '7418529630', 'Asunto: soporte', 'leido', '2026-08-27 12:00:00', '2026-08-28 18:30:23.633', NULL, 'email');
INSERT INTO public.contact_messages (id, name, email, phone, message, status, "createdAt", "updatedAt", subject, channel) VALUES (5, 'Carla Mendoza', 'carla.mendoza@example.com', '0991112233', 'Hola, quisiera saber precios para una cabaña familiar en diciembre.', 'pendiente', '2026-08-28 16:00:00', '2026-08-28 18:30:23.633', 'consulta', 'whatsapp');
INSERT INTO public.contact_messages (id, name, email, phone, message, status, "createdAt", "updatedAt", subject, channel) VALUES (6, 'PRUEBA4 4', 'prueba4@gmail.com', '+593 992 485 712', 'Necesito ayuda', 'pendiente', '2026-08-31 14:28:42.065', '2026-08-31 14:28:42.065', 'soporte', 'whatsapp');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers (id, "firstName", "lastName", email, phone, document, "createdAt", "updatedAt") VALUES (14, 'Alexito', 'Patiño', 'prueba3@gmail.com', '+593984461622', NULL, '2026-08-27 16:44:41', '2026-08-28 18:30:23.633');
INSERT INTO public.customers (id, "firstName", "lastName", email, phone, document, "createdAt", "updatedAt") VALUES (19, 'Alexis', 'Patiño', 'prueba4@gmail.com', '+593123456789', NULL, '2026-08-28 15:18:17', '2026-08-28 18:30:23.633');


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) VALUES (1, 'Los Chicos', 'Con mucha tradición, el lugar predilecto.', 4, 120.00, true, '2026-08-28 17:46:30.139', '2026-08-28 17:46:30.139', '/uploads/images-1787599159927-397503841.jpg', 'active', 'FAMILIAR');
INSERT INTO public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) VALUES (2, 'Las Chicas', 'Un lugar especial.', 4, 180.00, true, '2026-08-28 17:46:30.236', '2026-08-28 17:46:30.236', '/uploads/images-1787599177053-175635906.jpg', 'active', 'FAMILIAR');
INSERT INTO public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) VALUES (3, 'Los Primos', 'Para familias grandes.', 4, 110.00, true, '2026-08-28 17:46:30.248', '2026-08-28 17:46:30.248', '/uploads/images-1787599195795-497996123.jpg', 'active', 'FAMILIAR');
INSERT INTO public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) VALUES (4, 'Los Invitados', 'Habitación especial.', 4, 130.00, true, '2026-08-28 17:46:30.258', '2026-08-28 17:46:30.258', '/uploads/images-1787599649004-913940113.jpg', 'active', 'FAMILIAR');
INSERT INTO public.rooms (id, name, description, capacity, "pricePerNight", "isActive", "createdAt", "updatedAt", "photoUrl", status, type) VALUES (5, 'La Abuela', 'Ambiente íntimo.', 4, 150.00, false, '2026-08-28 17:46:30.268', '2026-09-01 17:24:47.113', '/uploads/images-1787599149834-33111325.jpg', 'inactive', 'FAMILIAR');


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (14, 1, 19, '2026-08-28 00:00:00', '2026-08-29 00:00:00', 120.00, 'CANCELADA', '2026-08-25 19:31:05', '2026-08-28 18:30:23.633', NULL, NULL, NULL);
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (49, 1, 14, '2026-08-29 00:00:00', '2026-08-31 00:00:00', 240.00, 'CANCELADA', '2026-08-28 13:50:01', '2026-08-28 18:30:23.633', '5 personas', NULL, '18:30');
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (50, 1, 14, '2026-08-29 00:00:00', '2026-08-31 00:00:00', 240.00, 'CANCELADA', '2026-08-28 14:06:00', '2026-08-28 18:30:23.633', '5 personas', NULL, '18:30');
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (55, 2, 19, '2026-08-30 00:00:00', '2026-08-31 00:00:00', 180.00, 'CANCELADA', '2026-08-28 15:18:17', '2026-08-28 18:30:23.633', '3 personas', NULL, '05:05');
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (13, 1, 19, '2026-08-26 00:00:00', '2026-08-27 00:00:00', 120.00, 'CANCELADA', '2026-08-25 19:24:55', '2026-08-31 14:41:49.857', NULL, NULL, NULL);
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (56, 2, 19, '2026-08-29 00:00:00', '2026-08-30 00:00:00', 180.00, 'CANCELADA', '2026-08-28 15:20:00', '2026-08-31 14:40:25.543', '1 persona', NULL, '00:00');
INSERT INTO public.reservations (id, "roomId", "customerId", "checkIn", "checkOut", "totalPrice", status, "createdAt", "updatedAt", guests, message, "preferredTime") VALUES (48, 5, 14, '2026-08-28 00:00:00', '2026-09-01 00:00:00', 600.00, 'COMPLETADA', '2026-08-27 16:44:41', '2026-09-01 17:24:02.491', '6+ personas', NULL, '00:00');


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 6, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 19, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservations_id_seq', 56, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rooms_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict k37wXHhxOasOFi6O8ejrduEOqirtAL4fOLTIzOZzhV2nUTxRCagBidorAIXLzah

