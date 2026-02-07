-- clear tables
TRUNCATE TABLE
  chatbot_quick_reply,
  chatbot_template
RESTART IDENTITY CASCADE;

-- Chatbot templates (multilingual defaults)
INSERT INTO chatbot_template (organisation_id, industry, intent, language, template_text, is_default) VALUES

-- ================= DEFAULT =================

(NULL, 'default', 'greet', 'en', 'Hi! How can I help you today?', TRUE),
(NULL, 'default', 'greeting', 'en', 'Hi! How can I help you today?', TRUE),
(NULL, 'default', 'website', 'en', 'You can visit our website at {{website_url}}.', TRUE),
(NULL, 'default', 'fallback', 'en', 'Sorry, I am not sure about that yet. Please contact {{contact_email}}.', TRUE),

(NULL, 'default', 'greet', 'fr', 'Bonjour ! Comment puis-je vous aider aujourd''hui ?', TRUE),
(NULL, 'default', 'greeting', 'fr', 'Bonjour ! Comment puis-je vous aider aujourd''hui ?', TRUE),
(NULL, 'default', 'website', 'fr', 'Vous pouvez visiter notre site a {{website_url}}.', TRUE),
(NULL, 'default', 'fallback', 'fr', 'Desole, je ne suis pas sur. Veuillez contacter {{contact_email}}.', TRUE),

(NULL, 'default', 'greet', 'zh', '您好！请问有什么可以帮您？', TRUE),
(NULL, 'default', 'greeting', 'zh', '您好！请问有什么可以帮您？', TRUE),
(NULL, 'default', 'website', 'zh', '您可以访问我们的网站：{{website_url}}。', TRUE),
(NULL, 'default', 'fallback', 'zh', '抱歉，我暂时无法回答这个问题。请联系 {{contact_email}}。', TRUE),

-- ================= RESTAURANT =================

(NULL, 'restaurant', 'greet', 'en', 'Hi! Welcome to {{company_name}}. How can I help you today?', TRUE),
(NULL, 'restaurant', 'greeting', 'en', 'Hi! Welcome to {{company_name}}. How can I help you today?', TRUE),
(NULL, 'restaurant', 'business_hours', 'en', '{{company_name}} is open from {{business_hours}} at {{location}}.', TRUE),
(NULL, 'restaurant', 'pricing', 'en', 'Prices may vary. Please contact {{contact_email}} for details.', TRUE),
(NULL, 'restaurant', 'menu', 'en', 'Our specialties include {{specialties}}. We serve {{cuisine_type}} cuisine in {{restaurant_style}} style.', TRUE),
(NULL, 'restaurant', 'dining_options', 'en', 'We offer {{dining_options}}.', TRUE),
(NULL, 'restaurant', 'reservation', 'en', 'Reservations supported: {{supports_reservations}}. Book here: {{reservation_link}}.', TRUE),
(NULL, 'restaurant', 'booking', 'en', 'Sure! What date, time, and number of guests?', TRUE),
(NULL, 'restaurant', 'location', 'en', '{{company_name}} is located at {{location}}.', TRUE),
(NULL, 'restaurant', 'website', 'en', 'Visit {{company_name}} at {{website_url}}.', TRUE),
(NULL, 'restaurant', 'contact_support', 'en', 'Contact us at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'restaurant', 'fallback', 'en', 'Sorry, I am not sure. Please contact {{contact_email}}.', TRUE),

(NULL, 'restaurant', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}.', TRUE),
(NULL, 'restaurant', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}.', TRUE),
(NULL, 'restaurant', 'business_hours', 'fr', '{{company_name}} est ouvert de {{business_hours}} a {{location}}.', TRUE),
(NULL, 'restaurant', 'pricing', 'fr', 'Les prix peuvent varier. Contactez {{contact_email}}.', TRUE),
(NULL, 'restaurant', 'menu', 'fr', 'Nos specialites incluent {{specialties}}. Cuisine {{cuisine_type}} style {{restaurant_style}}.', TRUE),
(NULL, 'restaurant', 'dining_options', 'fr', 'Nous proposons {{dining_options}}.', TRUE),
(NULL, 'restaurant', 'reservation', 'fr', 'Reservations : {{supports_reservations}}. Lien : {{reservation_link}}.', TRUE),
(NULL, 'restaurant', 'booking', 'fr', 'Quelle date, heure et combien de personnes ?', TRUE),
(NULL, 'restaurant', 'location', 'fr', '{{company_name}} se trouve a {{location}}.', TRUE),
(NULL, 'restaurant', 'website', 'fr', 'Visitez {{company_name}} sur {{website_url}}.', TRUE),
(NULL, 'restaurant', 'contact_support', 'fr', 'Contactez-nous a {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'restaurant', 'fallback', 'fr', 'Desole, je ne suis pas sur. Contactez {{contact_email}}.', TRUE),

(NULL, 'restaurant', 'greet', 'zh', '欢迎来到 {{company_name}}！请问有什么可以帮您？', TRUE),
(NULL, 'restaurant', 'greeting', 'zh', '欢迎来到 {{company_name}}！请问有什么可以帮您？', TRUE),
(NULL, 'restaurant', 'business_hours', 'zh', '{{company_name}} 的营业时间是 {{business_hours}}，地址是 {{location}}。', TRUE),
(NULL, 'restaurant', 'pricing', 'zh', '价格可能有所不同。详情请联系 {{contact_email}}。', TRUE),
(NULL, 'restaurant', 'menu', 'zh', '我们的特色包括 {{specialties}}。提供 {{cuisine_type}} 风味，属于 {{restaurant_style}} 风格。', TRUE),
(NULL, 'restaurant', 'dining_options', 'zh', '我们提供 {{dining_options}}。', TRUE),
(NULL, 'restaurant', 'reservation', 'zh', '是否支持预订：{{supports_reservations}}。链接：{{reservation_link}}。', TRUE),
(NULL, 'restaurant', 'booking', 'zh', '好的，请提供日期、时间和人数。', TRUE),
(NULL, 'restaurant', 'location', 'zh', '{{company_name}} 位于 {{location}}。', TRUE),
(NULL, 'restaurant', 'website', 'zh', '访问 {{company_name}} 网站：{{website_url}}。', TRUE),
(NULL, 'restaurant', 'contact_support', 'zh', '请通过 {{contact_email}} 或 {{contact_phone}} 联系我们。', TRUE),
(NULL, 'restaurant', 'fallback', 'zh', '抱歉，我暂时无法回答。请联系 {{contact_email}}。', TRUE),

-- education (EN)
(NULL, 'education', 'greet', 'en', 'Hi! Welcome to {{company_name}}. How can I assist you today?', TRUE),
(NULL, 'education', 'greeting', 'en', 'Hi! Welcome to {{company_name}}. How can I assist you today?', TRUE),
(NULL, 'education', 'business_hours', 'en', '{{company_name}} operates during {{business_hours}}. Would you like admissions help?', TRUE),
(NULL, 'education', 'pricing', 'en', 'Fees vary by course or program. Please email {{contact_email}} for details.', TRUE),
(NULL, 'education', 'courses', 'en', 'We offer {{course_types}} for {{target_audience}}. Popular programs include {{key_programs}}.', TRUE),
(NULL, 'education', 'intake', 'en', 'Upcoming intake periods: {{intake_periods}}.', TRUE),
(NULL, 'education', 'apply', 'en', 'You can apply here: {{application_link}}. Typical response time is {{response_time}}.', TRUE),
(NULL, 'education', 'delivery_mode', 'en', 'We offer {{delivery_mode}} learning options.', TRUE),
(NULL, 'education', 'booking', 'en', 'Are you looking to book a consultation or enroll in a course?', TRUE),
(NULL, 'education', 'location', 'en', '{{company_name}} is located at {{location}}.', TRUE),
(NULL, 'education', 'website', 'en', 'More information at {{website_url}}.', TRUE),
(NULL, 'education', 'contact_support', 'en', 'Contact our team at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'education', 'fallback', 'en', 'Sorry, I am not sure about that. Please contact {{contact_email}}.', TRUE),

-- education (FR)
(NULL, 'education', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}. Comment puis-je vous aider ?', TRUE),
(NULL, 'education', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}. Comment puis-je vous aider ?', TRUE),
(NULL, 'education', 'business_hours', 'fr', '{{company_name}} est ouvert pendant {{business_hours}}. Souhaitez-vous de l''aide pour les admissions ?', TRUE),
(NULL, 'education', 'pricing', 'fr', 'Les frais varient selon le programme. Veuillez ecrire a {{contact_email}} pour les details.', TRUE),
(NULL, 'education', 'courses', 'fr', 'Nous proposons {{course_types}} pour {{target_audience}}. Programmes populaires : {{key_programs}}.', TRUE),
(NULL, 'education', 'intake', 'fr', 'Periodes d''admission a venir : {{intake_periods}}.', TRUE),
(NULL, 'education', 'apply', 'fr', 'Vous pouvez postuler ici : {{application_link}}. Delai moyen de reponse : {{response_time}}.', TRUE),
(NULL, 'education', 'delivery_mode', 'fr', 'Nous proposons des options d''apprentissage {{delivery_mode}}.', TRUE),
(NULL, 'education', 'booking', 'fr', 'Souhaitez-vous reserver une consultation ou vous inscrire a un cours ?', TRUE),
(NULL, 'education', 'location', 'fr', '{{company_name}} se trouve a {{location}}.', TRUE),
(NULL, 'education', 'website', 'fr', 'Plus d''informations sur {{website_url}}.', TRUE),
(NULL, 'education', 'contact_support', 'fr', 'Contactez notre equipe a {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'education', 'fallback', 'fr', 'Desole, je ne suis pas sur. Veuillez contacter {{contact_email}}.', TRUE),

-- education (ZH)
(NULL, 'education', 'greet', 'zh', '您好！欢迎来到 {{company_name}}。请问有什么可以帮您？', TRUE),
(NULL, 'education', 'greeting', 'zh', '您好！欢迎来到 {{company_name}}。请问有什么可以帮您？', TRUE),
(NULL, 'education', 'business_hours', 'zh', '{{company_name}} 的营业时间为 {{business_hours}}。需要招生咨询吗？', TRUE),
(NULL, 'education', 'pricing', 'zh', '费用因课程而异。请发送邮件至 {{contact_email}} 获取最新信息。', TRUE),
(NULL, 'education', 'courses', 'zh', '我们提供 {{course_types}}，面向 {{target_audience}}。热门项目包括 {{key_programs}}。', TRUE),
(NULL, 'education', 'intake', 'zh', '近期入学时间：{{intake_periods}}。', TRUE),
(NULL, 'education', 'apply', 'zh', '申请链接：{{application_link}}。通常回复时间为 {{response_time}}。', TRUE),
(NULL, 'education', 'delivery_mode', 'zh', '我们提供 {{delivery_mode}} 的学习方式。', TRUE),
(NULL, 'education', 'booking', 'zh', '您是想预约咨询还是报名课程？', TRUE),
(NULL, 'education', 'location', 'zh', '{{company_name}} 位于 {{location}}。', TRUE),
(NULL, 'education', 'website', 'zh', '更多信息请访问 {{website_url}}。', TRUE),
(NULL, 'education', 'contact_support', 'zh', '您可以通过 {{contact_email}} 或 {{contact_phone}} 联系我们。', TRUE),
(NULL, 'education', 'fallback', 'zh', '抱歉，我暂时无法回答这个问题。请联系 {{contact_email}}。', TRUE),


-- retail (EN)
(NULL, 'retail', 'greet', 'en', 'Hi! Welcome to {{company_name}}. How can I help you today?', TRUE),
(NULL, 'retail', 'greeting', 'en', 'Hi! Welcome to {{company_name}}. How can I help you today?', TRUE),
(NULL, 'retail', 'business_hours', 'en', '{{company_name}} is open from {{business_hours}} at {{location}}.', TRUE),
(NULL, 'retail', 'pricing', 'en', 'Prices may vary by product. Contact us at {{contact_email}} for promotions or enquiries.', TRUE),
(NULL, 'retail', 'products', 'en', 'We carry {{product_categories}}. Let us know what you are looking for.', TRUE),
(NULL, 'retail', 'delivery', 'en', 'Delivery options: {{delivery_options}}. Online store: {{online_store_url}}.', TRUE),
(NULL, 'retail', 'returns', 'en', 'Our return policy: {{return_policy}}.', TRUE),
(NULL, 'retail', 'warranty', 'en', 'Warranty information: {{warranty_info}}.', TRUE),
(NULL, 'retail', 'payment_methods', 'en', 'We accept {{payment_methods}}.', TRUE),
(NULL, 'retail', 'booking', 'en', 'Are you looking to reserve an item, check availability, or place an order?', TRUE),
(NULL, 'retail', 'location', 'en', '{{company_name}} store is located at {{location}}.', TRUE),
(NULL, 'retail', 'website', 'en', 'Our website is {{website_url}}.', TRUE),
(NULL, 'retail', 'contact_support', 'en', 'Contact our support team at {{contact_email}} or {{contact_phone}}.', TRUE),
(NULL, 'retail', 'fallback', 'en', 'Sorry, I am not sure about that. Please contact {{contact_email}}.', TRUE),

-- retail (FR)
(NULL, 'retail', 'greet', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}. Comment puis-je vous aider ?', TRUE),
(NULL, 'retail', 'greeting', 'fr', 'Bonjour ! Bienvenue chez {{company_name}}. Comment puis-je vous aider ?', TRUE),
(NULL, 'retail', 'business_hours', 'fr', '{{company_name}} est ouvert de {{business_hours}} a {{location}}.', TRUE),
(NULL, 'retail', 'pricing', 'fr', 'Les prix peuvent varier selon le produit. Contactez-nous a {{contact_email}} pour les promotions ou questions.', TRUE),
(NULL, 'retail', 'products', 'fr', 'Nous proposons {{product_categories}}. Dites-nous ce que vous cherchez.', TRUE),
(NULL, 'retail', 'delivery', 'fr', 'Options de livraison : {{delivery_options}}. Boutique en ligne : {{online_store_url}}.', TRUE),
(NULL, 'retail', 'returns', 'fr', 'Notre politique de retour : {{return_policy}}.', TRUE),
(NULL, 'retail', 'warranty', 'fr', 'Informations de garantie : {{warranty_info}}.', TRUE),
(NULL, 'retail', 'payment_methods', 'fr', 'Nous acceptons {{payment_methods}}.', TRUE),
(NULL, 'retail', 'booking', 'fr', 'Souhaitez-vous reserver un article, verifier la disponibilite ou passer une commande ?', TRUE),
(NULL, 'retail', 'location', 'fr', 'Le magasin {{company_name}} se trouve a {{location}}.', TRUE),
(NULL, 'retail', 'website', 'fr', 'Notre site web : {{website_url}}.', TRUE),
(NULL, 'retail', 'contact_support', 'fr', 'Contactez notre support a {{contact_email}} ou {{contact_phone}}.', TRUE),
(NULL, 'retail', 'fallback', 'fr', 'Desole, je ne suis pas sur. Veuillez contacter {{contact_email}}.', TRUE),

-- retail (ZH)
(NULL, 'retail', 'greet', 'zh', '您好！欢迎来到 {{company_name}}。请问有什么可以帮您？', TRUE),
(NULL, 'retail', 'greeting', 'zh', '您好！欢迎来到 {{company_name}}。请问有什么可以帮您？', TRUE),
(NULL, 'retail', 'business_hours', 'zh', '{{company_name}} 营业时间为 {{business_hours}}，地址：{{location}}。', TRUE),
(NULL, 'retail', 'pricing', 'zh', '价格可能因产品而异。如需优惠或咨询，请联系 {{contact_email}}。', TRUE),
(NULL, 'retail', 'products', 'zh', '我们提供 {{product_categories}}。请告诉我您想寻找什么。', TRUE),
(NULL, 'retail', 'delivery', 'zh', '配送方式：{{delivery_options}}。线上商店：{{online_store_url}}。', TRUE),
(NULL, 'retail', 'returns', 'zh', '退换政策：{{return_policy}}。', TRUE),
(NULL, 'retail', 'warranty', 'zh', '保修信息：{{warranty_info}}。', TRUE),
(NULL, 'retail', 'payment_methods', 'zh', '我们接受 {{payment_methods}}。', TRUE),
(NULL, 'retail', 'booking', 'zh', '您想预留商品、查询库存，还是下单？', TRUE),
(NULL, 'retail', 'location', 'zh', '{{company_name}} 门店位于 {{location}}。', TRUE),
(NULL, 'retail', 'website', 'zh', '我们的网站：{{website_url}}。', TRUE),
(NULL, 'retail', 'contact_support', 'zh', '您可以通过 {{contact_email}} 或 {{contact_phone}} 联系客服。', TRUE),
(NULL, 'retail', 'fallback', 'zh', '抱歉，我暂时无法回答该问题。请联系 {{contact_email}}。', TRUE);


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
