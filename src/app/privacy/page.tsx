'use client'

import React from 'react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 mt-16">Privacy Policy</h1>

        <div className="text-sm text-gray-500 mb-16">
          Last updated: {new Date().toLocaleDateString()}
        </div>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account information: When you create an account, we collect your name, email address, and password.</li>
              <li>Travel preferences: Information about your travel interests, preferences, and requirements that you provide to help us customize your travel recommendations.</li>
              <li>Search data: Information about your travel searches, including destinations, dates, accommodation preferences, and budget constraints.</li>
              <li>Booking information: When you make or request bookings through our service, we collect details necessary to complete those bookings, which may include traveler names, contact information, payment information, and special requests.</li>
              <li>Communications: Information you provide when contacting us for support or communicating with us through various channels.</li>
            </ul>
            <p className="mt-2">
              We also automatically collect certain information when you use our services, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Usage data: Information about how you interact with our services, such as the features you use, pages you visit, and actions you take.</li>
              <li>Device information: Information about the device you use to access our services, including device type, operating system, browser type, and IP address.</li>
              <li>Cookies and similar technologies: We use cookies and similar technologies to collect information about your browsing activities and to manage your preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our travel planning and recommendation services</li>
              <li>Process your travel searches and provide personalized travel recommendations</li>
              <li>Facilitate bookings with third-party travel service providers</li>
              <li>Communicate with you about your account, our services, and travel-related information</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends to improve user experience</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Comply with legal obligations and enforce our terms and policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p>
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Travel service providers: To facilitate your travel arrangements, we may share necessary information with hotels, airlines, and other travel service providers.</li>
              <li>Third-party service providers: We work with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and customer service.</li>
              <li>Business partners: We may share information with business partners who offer services that may be of interest to you, but only with your consent.</li>
              <li>Legal requirements: We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information to third parties for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect the security of your personal information against unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When determining how long to retain information, we consider the amount, nature, and sensitivity of the information, the potential risk of harm from unauthorized use or disclosure, and the purposes for which we process the information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access: You can request access to the personal information we hold about you.</li>
              <li>Correction: You can request that we correct inaccurate or incomplete information.</li>
              <li>Deletion: You can request that we delete your personal information in certain circumstances.</li>
              <li>Restriction: You can request that we restrict the processing of your information in certain circumstances.</li>
              <li>Data portability: You can request a copy of your personal information in a structured, commonly used, and machine-readable format.</li>
              <li>Objection: You can object to our processing of your personal information in certain circumstances.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
            <p>
              We may transfer your personal information to countries other than the one in which you reside. When we transfer personal information across borders, we take appropriate safeguards to ensure that your information is protected in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without parental consent, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at{' '}
              <a 
                href="mailto:support@aitinerary.world"
                className="text-blue-500 hover:text-blue-600"
              >
                support@aitinerary.world
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
} 