import React, { useState, useEffect } from 'react';
import { faqService } from '../api';
import { FAQ } from '../types';

export const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const response = await faqService.listFaqs();
      if (response.ok && response.faqs) {
        setFaqs(response.faqs);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-medium text-center text-gray-900 mb-20">Frequently Asked Questions</h1>

      <h2 className="text-2xl font-normal text-gray-800 mb-8">Top 5 FAQ</h2>

      <div className="space-y-8">
        {faqs.map((faq) => (
          <div key={faq.faq_id} className="border-b border-gray-400 pb-2">
            <h3 className="text-gray-800 text-lg hover:text-blue-600 cursor-pointer transition-colors mb-2 font-semibold">
              {faq.question}
            </h3>
            <p className="text-gray-600 mb-2">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};