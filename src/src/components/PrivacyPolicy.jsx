import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import logo from '../assets/logo.png'; 
import Image from '../assets/Image.jpg'; 

const PrivacyPolicy = () => {
  return (
    // --- WRAPPER ---
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden">
      
      {/* --- BACKGROUND --- */}
  
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-in-out" 
             style={{ backgroundImage: `url(${Image})` }}>
          
          {/* Dark overlay for better text readability */}
          <div className="w-full h-full bg-black/20"></div>
        </div>
      </div>

      {/* --- MAIN CONTENT SCROLLABLE AREA --- */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center py-6 px-4 sm:px-6">
        
        {/* --- TOP NAV BAR --- */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8 mt-4">
          {/* Home Link (Simulated Back Button) */}
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
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-10 text-gray-800">
          
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-rose-600 uppercase tracking-wider mb-2">
              Privacy Policy
            </h1>
             <p className="text-sm sm:text-base text-gray-500 font-medium">
              SacredHearts Dating App
            </p>
            <p className="text-xs text-gray-400 mt-2">Last Updated: 1st January 2026</p>
          </div>

          {/* Intro */}
          <p className="mb-8 text-gray-600 leading-relaxed text-center">
            Your privacy matters to us. This policy explains how we collect, use, and protect your information.
          </p>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              1. Information We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>We may collect:</li>
              <li className="font-medium">Name, email, date of birth</li>
              <li className="font-medium">Profile information (photos, bio, preferences)</li>
              <li className="font-medium">Messages and interactions within the app</li>
              <li className="font-medium">Technical data (device type, IP address)</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Create and manage your account</li>
              <li>Match you with compatible users</li>
              <li>Improve app performance and safety</li>
              <li>Communicate important updates</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">3. Data Sharing</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li><strong>We do not sell</strong> your personal data.</li>
              <li>Your profile information is visible only to other users within the app.</li>
              <li>We may share data if required by law or to protect user safety.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">4. Data Security</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li><strong>We use industry-standard security measures.</strong></li>
              <li>However, no system is 100% secure. Use the app responsibly.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">5. Your Choices</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Edit or delete your profile information</li>
              <li>Request account deletion at any time</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">6. Children’s Privacy</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Sacredheart is not intended for users under 18.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4">7. Updates to This Policy</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>We may update this Privacy Policy periodically.</li>
              <li>Continued use means acceptance.</li>
            </ul>
          </section>

        </div>

        {/* --- FOOTER --- */}
        <div className="text-center mt-6">
          <p className="text-[10px] sm:text-xs text-gray-300 tracking-wide drop-shadow-sm">
            &copy; 2026 SacredHearts. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;