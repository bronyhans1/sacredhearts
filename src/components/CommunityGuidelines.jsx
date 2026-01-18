import React from 'react';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import Image from '../assets/Image.jpg';

const CommunityGuidelines = () => {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={Image} className="w-full h-full object-cover" alt="SacredHearts Background" />
      </div>

      {/* --- MAIN CONTENT SCROLLABLE AREA --- */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center py-6 px-4 sm:px-6">
        
        {/* --- TOP NAV BAR --- */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8 mt-4">
          {/* Back Button */}
          <a href="/" className="group flex items-center gap-2 text-white/90 hover:text-white transition-colors">
            <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 group-hover:bg-white/20 transition-all">
              <ArrowLeft size={20} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide drop-shadow-md">Home</span>
          </a>

          {/* Logo */}
          <img src={logo} alt="SacredHearts Logo" className="h-16 w-auto object-contain drop-shadow-2xl filter brightness-110" />
        </div>

        {/* --- CONTENT CARD --- */}
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-10 text-gray-800">
          
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-rose-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
               Community Guidelines
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              SacredHearts Dating App
            </p>
            <p className="text-xs text-gray-400 mt-2">Last Updated: 1st January 2026</p>
          </div>

          {/* Intro */}
          <div className="text-center mb-8 px-4 sm:px-8">
            <p className="text-gray-600 leading-relaxed">
              Sacredheart is a faith-centered, love-focused community. These guidelines help keep it safe and respectful for everyone.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">1</span> Be Respectful
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Treat all users with kindness and dignity.</li>
              <li>Differences in beliefs, culture, and background must be respected.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">2</span> Be Honest
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Use real photos.</li>
              <li>Provide truthful information.</li>
              <li>No impersonation or misleading behavior.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">3</span> No Harassment or Abuse
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>We do not tolerate:</li>
              <li>Hate speech</li>
              <li>Sexual harassment</li>
              <li>Threats or intimidation</li>
              <li>Bullying or shaming</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">4</span> Appropriate Content Only
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>No explicit or pornographic content.</li>
              <li>No violent or disturbing material.</li>
              <li>No promotion of illegal activities.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">5</span> Faith & Values
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Sacredheart welcomes people seeking meaningful connections grounded in values.</li>
              <li>Disrespect toward faith or personal beliefs is not allowed.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">6</span> Reporting & Enforcement
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Users may report violations.</li>
              <li>We review reports seriously and take appropriate action.</li>
              <li>Violations may result in warnings, suspension, or permanent removal.</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-[10px] sm:text-xs text-gray-300 tracking-wide drop-shadow-sm">
              &copy; 2026 SacredHearts. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;