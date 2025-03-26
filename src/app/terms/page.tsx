'use client'

import React from 'react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 mt-16">Terms and Conditions</h1>

        <div className="text-sm text-gray-500 mb-16">
          Last updated: {new Date().toLocaleDateString()}
        </div>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using aitinerary.world ("the Website"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p>
              Aitinerary.world provides travel planning services, including but not limited to itinerary suggestions, hotel recommendations, flight information, and other travel-related guidance. Our services rely on third-party data sources and APIs to provide information about travel options, pricing, and availability.
            </p>
            <p className="mt-2">
              All information provided through our services is for guidance purposes only. While we strive to ensure the accuracy and timeliness of the information we provide, we cannot guarantee that all information is complete, accurate, or up-to-date at all times.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Third-Party Services and Information</h2>
            <p>
              Our services may include information and content from third-party providers, including hotels, airlines, tour operators, and other travel service providers. We do not endorse, guarantee, or assume responsibility for any third-party services, products, or information.
            </p>
            <p className="mt-2">
              Prices, availability, terms, and other details for travel services may change between the time information is displayed on our website and the time of booking. We recommend verifying all details directly with the service provider before making any final arrangements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Disclaimer of Warranties</h2>
            <p>
              The materials and services on aitinerary.world are provided on an 'as is' basis. Aitinerary.world makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="mt-2">
              We do not warrant that the service will be uninterrupted, timely, secure, or error-free, or that defects will be corrected. We do not warrant that the results that may be obtained from the use of the service will be accurate or reliable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p>
              In no event shall aitinerary.world, its operators, affiliates, agents, or content providers be liable for any damages (including, without limitation, damages for loss of data or profit, personal injury, property damage, or due to business interruption) arising out of:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The use or inability to use our services</li>
              <li>Any travel arrangements made based on information provided through our services</li>
              <li>Any actions or omissions of third-party service providers</li>
              <li>Any events that occur during travel, including but not limited to accidents, illness, injuries, property loss or damage, travel delays, cancellations, or changes in itinerary</li>
              <li>Natural disasters, political unrest, terrorism, or other events beyond our reasonable control</li>
            </ul>
            <p className="mt-2">
              You acknowledge and agree that travel involves inherent risks, and you assume full responsibility for all risks associated with your travel arrangements and activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Travel Documentation and Requirements</h2>
            <p>
              You are solely responsible for obtaining and maintaining all necessary travel documentation, including but not limited to valid passports, visas, health certificates, insurance, and other requirements for your intended destinations. Aitinerary.world is not responsible for advising on or ensuring compliance with these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless aitinerary.world, its operators, affiliates, and partners from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) that such parties may incur as a result of or arising from your use of our services or your violation of these Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p>
              Aitinerary.world reserves the right to modify these terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the service after such modifications constitutes your acceptance of the revised terms.
            </p>
          </section>
        </div>

      </div>
    </main>
  )
} 