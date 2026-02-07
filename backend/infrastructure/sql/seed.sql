-- clear tables
TRUNCATE TABLE
  analytics,
  chatbot_quick_reply,
  chatbot_template,
  chatbot,
  feedback,
  notification,
  invitation,
  app_user,
  org_role_permission,
  org_permission,
  org_role,
  personality,
  organisation,
  subscription_features,
  feature,
  subscription,
  system_role
RESTART IDENTITY CASCADE;


INSERT INTO system_role (system_role_id, name, description) VALUES
(0, 'SYS_ADMIN', 'System administrator with full platform access'),
(1, 'APP_USER', 'Application user belonging to an organisation');


INSERT INTO subscription (name, price, staff_user_limit, status, description) VALUES
('Standard', 10.00, 3, 0, 'Best for small teams or startups. Covers essential chatbot features.'),
('Pro', 25.00, 10, 0, 'Ideal for growing businesses. Includes enhanced analytics.'),
('Deluxe', 50.00, 25, 0, 'Designed for large organizations. Full access to premium and enterprise features.');


INSERT INTO feature (name, description) VALUES
('Analyze', 'Gain deep insights into customer conversations with real-time analytics.'),
('Train', 'Continuously improve your bot with smart, adaptive learning workflows.'),
('Customize', 'Easily tailor every aspect of your chatbot to match your brand.');


INSERT INTO subscription_features (subscription_id, feature_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3),
(2, 1, 1), (2, 2, 2), (2, 3, 3),
(3, 1, 1), (3, 2, 2), (3, 3, 3);


INSERT INTO organisation (
  name,
  industry,
  subscription_id,
  location,
  city,
  country,
  contact_email,
  contact_phone,
  website_url,
  business_hours
) VALUES
('Prata Rasa', 'F&B', 3, '123 Prata Street, Singapore 123456', 'Singapore', 'Singapore', 'contact@pratarasa.com', '+65 6123 4567', 'https://pratarasa.example.com', 'Mon-Sun 9:00 AM - 10:00 PM'),
('Retailers', 'Retail', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Edu', 'Education', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- organisation 1: F&B (Restaurant profile)
INSERT INTO organisation_restaurant (
    organisation_id,
    cuisine_type,
    restaurant_style,
    dining_options,
    supports_reservations,
    reservation_link,
    price_range,
    seating_capacity,
    specialties
) VALUES (
    1,
    'Indian / Local',
    'Casual Dining',
    'Dine-in, Takeaway',
    TRUE,
    'https://spplace.com/',
    '$$',
    60,
    'Prata, Thosai, Teh Tarik'
);


INSERT INTO org_role (organisation_id, name, description) VALUES
(1, 'ORG_ADMIN', 'Organisation administrator'),
(1, 'STAFF', 'Standard staff user'),
(2, 'ORG_ADMIN', 'Organisation administrator'),
(2, 'STAFF', 'Standard staff user'),
(3, 'ORG_ADMIN', 'Organisation administrator'),
(3, 'STAFF', 'Standard staff user');


INSERT INTO org_permission (code, description) VALUES
('MANAGE_CHATBOT', 'Customize and configure chatbot'),
('VIEW_CHAT_HISTORY', 'View chatbot conversation history'),
('MANAGE_USERS', 'Invite and manage organisation staff'),
('SUBMIT_FEEDBACK', 'Submit feedback to the system'),
('MANAGE_ACCOUNT', 'Manage user account settings'),
('MANAGE_ORG_PROFILE', 'Manage organisation profile and settings');

INSERT INTO org_role_permission (org_role_id, org_permission_id)
SELECT r.org_role_id, p.org_permission_id
FROM org_role r
CROSS JOIN org_permission p
WHERE r.name = 'ORG_ADMIN';

INSERT INTO org_role_permission (org_role_id, org_permission_id)
SELECT r.org_role_id, p.org_permission_id
FROM org_role r
JOIN org_permission p
  ON p.code IN ('VIEW_CHAT_HISTORY', 'SUBMIT_FEEDBACK')
WHERE r.name = 'STAFF';

INSERT INTO personality (name, description, type) VALUES
('Friendly & Casual', 'Light-hearted and approachable', 'Casual'),
('Professional & Formal', 'Polite and business-like', 'Formal');

-- system admin (no organisation id)
INSERT INTO app_user (username, password, email, status, system_role_id, org_role_id, organisation_id) VALUES
('Admin', 'scrypt:32768:8:1$gNx6ufk63R9woldo$982e68d21720567615cee04c8ac7ad53050139c235606866239321e53401eb3e5f8e5fe123986e30bc7acabac722114e5cf90cc23203e1670f9e97a04b947c06', 'admin@test.com', TRUE, 0, NULL, NULL);

-- app user, org user.
INSERT INTO app_user (username, password, email, status, system_role_id, org_role_id, organisation_id) VALUES
('Alice', 'scrypt:32768:8:1$OWqAGgPDlwkPpNOf$e2c2ab94584554973418ad6f0044b280a5aa495e8a141cb65e35c2b781e9ef2b18844124a92fc310797ed7a139010c4883c221f3f8a13ea81bdf4d42f50d59df', 'alice@test.com', TRUE, 1, 1, 1);

-- app user, staff user
INSERT INTO app_user (username, password, email, status, system_role_id, org_role_id, organisation_id) VALUES
('Bob', 'scrypt:32768:8:1$OWqAGgPDlwkPpNOf$e2c2ab94584554973418ad6f0044b280a5aa495e8a141cb65e35c2b781e9ef2b18844124a92fc310797ed7a139010c4883c221f3f8a13ea81bdf4d42f50d59df', 'bob@test.com', TRUE, 1, 2, 1);


INSERT INTO faq (question, answer, status, display_order) VALUES
('How does the conversation limit work?', 'Each subscription plan has a monthly conversation limit...', 0, 1),
('Do I need technical knowledge to build a chatbot?', 'No technical knowledge is required...', 0, 2),
('Can I customize the chatbot to fit my company branding?', 'Yes, you can customize...', 0, 3),
('What integrations are supported?', 'The chatbot supports integrations...', 0, 4),
('Is my data secure?', 'We prioritize data security...', 0, 5);

INSERT INTO notification (title, content, is_read, user_id) VALUES
('Notice', 'Feedback Successfully Sent.', FALSE, 2),
('Reminder', 'Complete your profile, Bob.', FALSE, 2);

INSERT INTO feedback (sender_id, purpose, rating, content) VALUES
(3, 'Overall Experience', 5, 'The chatbot delivered an excellent experience with accurate responses and great usability.'),
(2, 'Overall Experience', 4, 'Consistent professionalism and quality output.');

-- Chatbot templates (multilingual defaults)
INSERT INTO chatbot_template (organisation_id, industry, intent, language, template_text, is_default) VALUES
-- default (EN)
(NULL, 'default', 'greet', 'en', 'Hi! How can I help you today?', TRUE),
(NULL, 'default', 'greeting', 'en', 'Hi! How can I help you today?', TRUE),
(NULL, 'default', 'website', 'en', 'You can visit our website at {{website_url}}.', TRUE),
(NULL, 'default', 'fallback', 'en', 'Sorry — I’m not sure about that yet. Please contact {{contact_email}}.', TRUE),
-- default (FR)
(NULL, 'default', 'greet', 'fr', 'Bonjour ! Comment puis-je vous aider aujourd''hui ?', TRUE),
(NULL, 'default', 'greeting', 'fr', 'Bonjour ! Comment puis-je vous aider aujourd''hui ?', TRUE),
(NULL, 'default', 'website', 'fr', 'Vous pouvez visiter notre site à {{website_url}}.', TRUE),
(NULL, 'default', 'fallback', 'fr', 'Désolé — je ne suis pas sûr. Veuillez contacter {{contact_email}}.', TRUE),
-- default (ZH)
(NULL, 'default', 'greet', 'zh', '您好！我能帮您什么？', TRUE),
(NULL, 'default', 'greeting', 'zh', '您好！我能帮您什么？', TRUE),
(NULL, 'default', 'website', 'zh', '您可以访问我们的网站：{{website_url}}。', TRUE),
(NULL, 'default', 'fallback', 'zh', '抱歉，我不确定。请联系 {{contact_email}}。', TRUE),

-- restaurant (EN)
(NULL, 'restaurant', 'greet', 'en', 'Hi! Welcome to {{company_name}} 😊 How can I help you today?', TRUE),
(NULL, 'restaurant', 'greeting', 'en', 'Hi! Welcome to {{company_name}} 😊 How can I help you today?', TRUE),
(NULL, 'restaurant', 'business_hours', 'en', '🍽️ {{company_name}} is open from {{business_hours}} at {{location}}.', TRUE),
(NULL, 'restaurant', 'pricing', 'en', 'Our pricing may vary depending on your order. For details, contact us at {{contact_email}}.', TRUE),
(NULL, 'restaurant', 'menu', 'en', 'Here are our specialties: {{specialties}}. We serve {{cuisine_type}} cuisine in a {{restaurant_style}} style.', TRUE),
(NULL, 'restaurant', 'dining_options', 'en', 'We offer {{dining_options}}. Let us know if you''d like delivery or takeaway.', TRUE),
(NULL, 'restaurant', 'reservation', 'en', 'Reservations are {{supports_reservations}}. Book here: {{reservation_link}}.', TRUE),
(NULL, 'restaurant', 'booking', 'en', 'Sure! What date/time would you like to reserve, and how many pax?', TRUE),
(NULL, 'restaurant', 'location', 'en', '{{company_name}} is located at {{location}}.', TRUE),
(NULL, 'restaurant', 'website', 'en', 'You can visit {{company_name}} online at {{website_url}}.', TRUE),
(NULL, 'restaurant', 'contact_support', 'en', 'You can reach us at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'restaurant', 'fallback', 'en', 'Sorry — I’m not sure about that. You can contact us at {{contact_email}}.', TRUE),
-- restaurant (FR)
(NULL, 'restaurant', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 😊 Comment puis-je vous aider ?', TRUE),
(NULL, 'restaurant', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 😊 Comment puis-je vous aider ?', TRUE),
(NULL, 'restaurant', 'business_hours', 'fr', '🍽️ {{company_name}} est ouvert de {{business_hours}} à {{location}}.', TRUE),
(NULL, 'restaurant', 'pricing', 'fr', 'Nos prix peuvent varier selon votre commande. Pour plus de détails, contactez-nous à {{contact_email}}.', TRUE),
(NULL, 'restaurant', 'menu', 'fr', 'Voici nos spécialités : {{specialties}}. Nous servons une cuisine {{cuisine_type}} dans un style {{restaurant_style}}.', TRUE),
(NULL, 'restaurant', 'dining_options', 'fr', 'Nous proposons {{dining_options}}. Dites-nous si vous souhaitez la livraison ou à emporter.', TRUE),
(NULL, 'restaurant', 'reservation', 'fr', 'Les réservations sont {{supports_reservations}}. Réservez ici : {{reservation_link}}.', TRUE),
(NULL, 'restaurant', 'booking', 'fr', 'Bien sûr ! Quelle date/heure souhaitez-vous réserver, et pour combien de personnes ?', TRUE),
(NULL, 'restaurant', 'location', 'fr', '{{company_name}} se trouve à {{location}}.', TRUE),
(NULL, 'restaurant', 'website', 'fr', 'Vous pouvez visiter {{company_name}} en ligne à {{website_url}}.', TRUE),
(NULL, 'restaurant', 'contact_support', 'fr', 'Vous pouvez nous joindre à {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'restaurant', 'fallback', 'fr', 'Désolé — je ne suis pas sûr. Vous pouvez nous contacter à {{contact_email}}.', TRUE),
-- restaurant (ZH)
(NULL, 'restaurant', 'greet', 'zh', '您好！欢迎来到{{company_name}} 😊 我能帮您什么？', TRUE),
(NULL, 'restaurant', 'greeting', 'zh', '您好！欢迎来到{{company_name}} 😊 我能帮您什么？', TRUE),
(NULL, 'restaurant', 'business_hours', 'zh', '🍽️ {{company_name}} 营业时间为 {{business_hours}}，地址：{{location}}。', TRUE),
(NULL, 'restaurant', 'pricing', 'zh', '价格可能因订单而异，详情请联系 {{contact_email}}。', TRUE),
(NULL, 'restaurant', 'menu', 'zh', '我们的特色有：{{specialties}}。我们提供{{cuisine_type}}美食，风格为{{restaurant_style}}。', TRUE),
(NULL, 'restaurant', 'dining_options', 'zh', '我们提供{{dining_options}}。如需外送或外带请告诉我们。', TRUE),
(NULL, 'restaurant', 'reservation', 'zh', '是否支持预订：{{supports_reservations}}。预订链接：{{reservation_link}}。', TRUE),
(NULL, 'restaurant', 'booking', 'zh', '好的！您想预订哪天/时间？几位？', TRUE),
(NULL, 'restaurant', 'location', 'zh', '{{company_name}} 位于 {{location}}。', TRUE),
(NULL, 'restaurant', 'website', 'zh', '您可以访问 {{company_name}} 的网站：{{website_url}}。', TRUE),
(NULL, 'restaurant', 'contact_support', 'zh', '您可以通过 {{contact_email}} 或 {{contact_phone}} 联系我们。', TRUE),
(NULL, 'restaurant', 'fallback', 'zh', '抱歉，我不确定。您可以通过 {{contact_email}} 联系我们。', TRUE),

-- education (EN)
(NULL, 'education', 'greet', 'en', 'Hi! Welcome to {{company_name}} 🎓 How can I assist you today?', TRUE),
(NULL, 'education', 'greeting', 'en', 'Hi! Welcome to {{company_name}} 🎓 How can I assist you today?', TRUE),
(NULL, 'education', 'business_hours', 'en', '{{company_name}} operates during {{business_hours}}. Would you like admissions help?', TRUE),
(NULL, 'education', 'pricing', 'en', 'Fees vary by course or program. Please email {{contact_email}} for the latest details.', TRUE),
(NULL, 'education', 'courses', 'en', 'We offer {{course_types}} for {{target_audience}}. Popular programs include {{key_programs}}.', TRUE),
(NULL, 'education', 'intake', 'en', 'Upcoming intake periods: {{intake_periods}}.', TRUE),
(NULL, 'education', 'apply', 'en', 'You can apply here: {{application_link}}. Typical response time is {{response_time}}.', TRUE),
(NULL, 'education', 'delivery_mode', 'en', 'We offer {{delivery_mode}} learning options.', TRUE),
(NULL, 'education', 'booking', 'en', 'Sure — are you looking to book a consultation or enroll in a course?', TRUE),
(NULL, 'education', 'location', 'en', '{{company_name}} is located at {{location}}.', TRUE),
(NULL, 'education', 'website', 'en', 'You can find more information at {{website_url}}.', TRUE),
(NULL, 'education', 'contact_support', 'en', 'You can contact our team at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'education', 'fallback', 'en', 'Sorry — I’m not sure about that. Please reach out at {{contact_email}}.', TRUE),
-- education (FR)
(NULL, 'education', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 🎓 Comment puis-je vous aider ?', TRUE),
(NULL, 'education', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 🎓 Comment puis-je vous aider ?', TRUE),
(NULL, 'education', 'business_hours', 'fr', '{{company_name}} est ouvert pendant {{business_hours}}. Souhaitez-vous de l''aide pour les admissions ?', TRUE),
(NULL, 'education', 'pricing', 'fr', 'Les frais varient selon le programme. Veuillez écrire à {{contact_email}} pour les derniers détails.', TRUE),
(NULL, 'education', 'courses', 'fr', 'Nous proposons {{course_types}} pour {{target_audience}}. Programmes populaires : {{key_programs}}.', TRUE),
(NULL, 'education', 'intake', 'fr', 'Périodes d''admission à venir : {{intake_periods}}.', TRUE),
(NULL, 'education', 'apply', 'fr', 'Vous pouvez postuler ici : {{application_link}}. Le délai moyen de réponse est {{response_time}}.', TRUE),
(NULL, 'education', 'delivery_mode', 'fr', 'Nous proposons des options d''apprentissage {{delivery_mode}}.', TRUE),
(NULL, 'education', 'booking', 'fr', 'Bien sûr — souhaitez-vous réserver une consultation ou vous inscrire à un cours ?', TRUE),
(NULL, 'education', 'location', 'fr', '{{company_name}} se trouve à {{location}}.', TRUE),
(NULL, 'education', 'website', 'fr', 'Plus d''informations sur {{website_url}}.', TRUE),
(NULL, 'education', 'contact_support', 'fr', 'Vous pouvez contacter notre équipe à {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'education', 'fallback', 'fr', 'Désolé — je ne suis pas sûr. Veuillez contacter {{contact_email}}.', TRUE),
-- education (ZH)
(NULL, 'education', 'greet', 'zh', '您好！欢迎来到{{company_name}} 🎓 我能帮您什么？', TRUE),
(NULL, 'education', 'greeting', 'zh', '您好！欢迎来到{{company_name}} 🎓 我能帮您什么？', TRUE),
(NULL, 'education', 'business_hours', 'zh', '{{company_name}} 的营业时间为 {{business_hours}}。需要招生咨询吗？', TRUE),
(NULL, 'education', 'pricing', 'zh', '费用因课程而异。请发邮件至 {{contact_email}} 获取最新信息。', TRUE),
(NULL, 'education', 'courses', 'zh', '我们提供 {{course_types}}，面向 {{target_audience}}。热门项目：{{key_programs}}。', TRUE),
(NULL, 'education', 'intake', 'zh', '近期入学时间：{{intake_periods}}。', TRUE),
(NULL, 'education', 'apply', 'zh', '申请链接：{{application_link}}。通常回复时间为 {{response_time}}。', TRUE),
(NULL, 'education', 'delivery_mode', 'zh', '我们提供 {{delivery_mode}} 的学习方式。', TRUE),
(NULL, 'education', 'booking', 'zh', '好的——您是想预约咨询还是报名课程？', TRUE),
(NULL, 'education', 'location', 'zh', '{{company_name}} 位于 {{location}}。', TRUE),
(NULL, 'education', 'website', 'zh', '更多信息请访问 {{website_url}}。', TRUE),
(NULL, 'education', 'contact_support', 'zh', '您可以通过 {{contact_email}} 或 {{contact_phone}} 联系我们。', TRUE),
(NULL, 'education', 'fallback', 'zh', '抱歉，我不确定。请联系 {{contact_email}}。', TRUE),

-- retail (EN)
(NULL, 'retail', 'greet', 'en', 'Hi! Welcome to {{company_name}} 🛍️ How can I help you today?', TRUE),
(NULL, 'retail', 'greeting', 'en', 'Hi! Welcome to {{company_name}} 🛍️ How can I help you today?', TRUE),
(NULL, 'retail', 'business_hours', 'en', '{{company_name}} is open from {{business_hours}} at {{location}}.', TRUE),
(NULL, 'retail', 'pricing', 'en', 'Prices may vary by product. For promotions or inquiries, contact us at {{contact_email}}.', TRUE),
(NULL, 'retail', 'products', 'en', 'We carry {{product_categories}}. Let us know what you''re looking for!', TRUE),
(NULL, 'retail', 'delivery', 'en', 'Delivery options: {{delivery_options}}. Online store: {{online_store_url}}.', TRUE),
(NULL, 'retail', 'returns', 'en', 'Our return policy: {{return_policy}}.', TRUE),
(NULL, 'retail', 'warranty', 'en', 'Warranty information: {{warranty_info}}.', TRUE),
(NULL, 'retail', 'payment_methods', 'en', 'We accept {{payment_methods}}.', TRUE),
(NULL, 'retail', 'booking', 'en', 'Are you looking to reserve an item, check availability, or place an order?', TRUE),
(NULL, 'retail', 'location', 'en', '{{company_name}} store is located at {{location}}.', TRUE),
(NULL, 'retail', 'website', 'en', 'Our website is {{website_url}}.', TRUE),
(NULL, 'retail', 'contact_support', 'en', 'You can reach our support team at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'retail', 'fallback', 'en', 'Sorry — I’m not sure about that. Please contact us at {{contact_email}}.', TRUE),
-- retail (FR)
(NULL, 'retail', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 🛍️ Comment puis-je vous aider ?', TRUE),
(NULL, 'retail', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}} 🛍️ Comment puis-je vous aider ?', TRUE),
(NULL, 'retail', 'business_hours', 'fr', '{{company_name}} est ouvert de {{business_hours}} à {{location}}.', TRUE),
(NULL, 'retail', 'pricing', 'fr', 'Les prix peuvent varier selon le produit. Pour les promotions ou questions, contactez-nous à {{contact_email}}.', TRUE),
(NULL, 'retail', 'products', 'fr', 'Nous proposons {{product_categories}}. Dites-nous ce que vous cherchez !', TRUE),
(NULL, 'retail', 'delivery', 'fr', 'Options de livraison : {{delivery_options}}. Boutique en ligne : {{online_store_url}}.', TRUE),
(NULL, 'retail', 'returns', 'fr', 'Notre politique de retour : {{return_policy}}.', TRUE),
(NULL, 'retail', 'warranty', 'fr', 'Informations de garantie : {{warranty_info}}.', TRUE),
(NULL, 'retail', 'payment_methods', 'fr', 'Nous acceptons {{payment_methods}}.', TRUE),
(NULL, 'retail', 'booking', 'fr', 'Souhaitez-vous réserver un article, vérifier la disponibilité ou passer une commande ?', TRUE),
(NULL, 'retail', 'location', 'fr', 'Le magasin {{company_name}} se trouve à {{location}}.', TRUE),
(NULL, 'retail', 'website', 'fr', 'Notre site web : {{website_url}}.', TRUE),
(NULL, 'retail', 'contact_support', 'fr', 'Vous pouvez contacter notre support à {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'retail', 'fallback', 'fr', 'Désolé — je ne suis pas sûr. Veuillez nous contacter à {{contact_email}}.', TRUE),
-- retail (ZH)
(NULL, 'retail', 'greet', 'zh', '您好！欢迎来到{{company_name}} 🛍️ 我能帮您什么？', TRUE),
(NULL, 'retail', 'greeting', 'zh', '您好！欢迎来到{{company_name}} 🛍️ 我能帮您什么？', TRUE),
(NULL, 'retail', 'business_hours', 'zh', '{{company_name}} 营业时间为 {{business_hours}}，地址：{{location}}。', TRUE),
(NULL, 'retail', 'pricing', 'zh', '价格可能因产品而异。如需优惠或咨询，请联系 {{contact_email}}。', TRUE),
(NULL, 'retail', 'products', 'zh', '我们提供 {{product_categories}}。告诉我您在找什么！', TRUE),
(NULL, 'retail', 'delivery', 'zh', '配送方式：{{delivery_options}}。线上商店：{{online_store_url}}。', TRUE),
(NULL, 'retail', 'returns', 'zh', '退换政策：{{return_policy}}。', TRUE),
(NULL, 'retail', 'warranty', 'zh', '保修信息：{{warranty_info}}。', TRUE),
(NULL, 'retail', 'payment_methods', 'zh', '我们接受 {{payment_methods}}。', TRUE),
(NULL, 'retail', 'booking', 'zh', '您想预留商品、查询库存，还是下单？', TRUE),
(NULL, 'retail', 'location', 'zh', '{{company_name}} 门店位于 {{location}}。', TRUE),
(NULL, 'retail', 'website', 'zh', '我们的网站：{{website_url}}。', TRUE),
(NULL, 'retail', 'contact_support', 'zh', '您可以通过 {{contact_email}} 或 {{contact_phone}} 联系客服。', TRUE),
(NULL, 'retail', 'fallback', 'zh', '抱歉，我不确定。请联系 {{contact_email}}。', TRUE);

-- Chatbot quick replies (multilingual defaults)
INSERT INTO chatbot_quick_reply (organisation_id, industry, intent, language, text, display_order) VALUES
(NULL, 'default', 'any', 'en', 'Business hours', 1),
(NULL, 'default', 'any', 'en', 'Location', 2),
(NULL, 'default', 'any', 'en', 'Pricing', 3),
(NULL, 'default', 'any', 'en', 'Contact support', 4),
(NULL, 'default', 'any', 'fr', 'Heures d''ouverture', 1),
(NULL, 'default', 'any', 'fr', 'Localisation', 2),
(NULL, 'default', 'any', 'fr', 'Tarifs', 3),
(NULL, 'default', 'any', 'fr', 'Contacter le support', 4),
(NULL, 'default', 'any', 'zh', '营业时间', 1),
(NULL, 'default', 'any', 'zh', '地址', 2),
(NULL, 'default', 'any', 'zh', '价格', 3),
(NULL, 'default', 'any', 'zh', '联系客服', 4);
