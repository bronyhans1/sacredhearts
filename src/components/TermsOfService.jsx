import React from 'react';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import Image from '../assets/Image.jpg';

const TermsOfService = () => {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat" 
             style={{ backgroundImage: `url(${Image})` }}>
          <div className="w-full h-full bg-black/15"></div>
        </div>
      </div>

      {/* --- MAIN CONTENT SCROLLABLE AREA --- */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center py-6 px-4 sm:px-6">
        
        {/* --- TOP NAV BAR --- */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8 mt-4">
          {/* Home Link (simulating a back button) */}
          <a 
            href="/" 
            className="group flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 group-hover:bg-white/20 transition-all">
              <ArrowLeft size={20} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide drop-shadow-md">Home</span>
          </a>

          {/* Logo */}
          <img 
            src={logo} 
            alt="SacredHearts Logo" 
            className="h-16 w-auto object-contain drop-shadow-2xl filter brightness-110" 
          />
        </div>

        {/* --- CONTENT CARD --- */}
        {/* Frosted glass card for excellent readability */}
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-10 text-gray-800">
          
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-rose-600 uppercase tracking-wider mb-2">
              Terms of Service
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              SacredHearts Dating App
            </p>
            <p className="text-xs text-gray-400 mt-2">Last Updated: 1st January 2026</p>
          </div>

          {/* Intro */}
          <p className="mb-8 text-gray-600 leading-relaxed">
            Welcome to Sacredheart. By accessing or using our app, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </p>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
               1. Eligibility
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>You must be 18 years or older to use Sacredhearts.</li>
              <li>By using the app, you confirm that all information you provide is truthful and accurate.</li>
              <li>Sacredheart is intended for individuals seeking meaningful, respectful connections.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">2. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>You are responsible for maintaining the confidentiality of your account.</li>
              <li>You agree not to impersonate another person or create multiple deceptive accounts.</li>
              <li>We reserve the right to suspend or terminate accounts that violate our policies.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">3. User Conduct</h2>
            <p className="font-semibold mb-2 text-gray-800">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2 mb-4">
              <li>Treat others with respect, dignity, and honesty.</li>
              <li>Use the app for lawful and appropriate purposes only.</li>
            </ul>
            <p className="font-semibold mb-2 text-gray-800">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Harass, threaten, exploit, or abuse other users.</li>
              <li>Share explicit, offensive, or hateful content.</li>
              <li>Engage in scams, fraud, or solicitation.</li>
              <li>Misuse the platform in any way that harms others.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">4. Matches & Connections</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Sacredheart does not guarantee matches, relationships, or outcomes.</li>
              <li>All interactions are voluntary and at your own discretion.</li>
              <li>You are responsible for your interactions both online and offline.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">5. Safety Disclaimer</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Sacredheart does not conduct criminal background checks.</li>
              <li>Always use caution when meeting someone in person.</li>
              <li>We encourage meeting in public places and informing someone you trust.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">6. Termination</h2>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your access at any time if you violate these Terms or our Community Guidelines.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. Continued use of the app means you accept the updated Terms.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">8. Contact</h2>
            <p className="text-gray-700 mb-2">For questions or concerns, contact us at:</p>
            <div className="flex items-center gap-2 text-rose-600 font-semibold">
              <Mail size={16} />
              <a href="mailto:support@sacredhearts.app">support@sacredhearts.app</a>
            </div>
          </section>

        </div>

        {/* --- FOOTER --- */}
        <p className="text-gray-300 text-xs mt-6 text-center drop-shadow-sm">
          &copy; 2026 SacredHearts. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;