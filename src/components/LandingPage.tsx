import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  Clock, 
  Zap, 
  Target, 
  Lock, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Database,
  Search,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight text-navy">Prepped Seller</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onStart}
              className="text-navy font-bold text-sm hover:underline"
            >
              Login
            </button>
            <button 
              onClick={onStart}
              className="bg-navy text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-navy-light transition-all shadow-md active:scale-95"
            >
              Get Prepped
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-navy/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-navy leading-tight tracking-tight">
              Selling a flat is slow. We make it faster.
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mt-8 max-w-2xl mx-auto leading-relaxed">
              The AI assistant that helps you get prepped early, so you can move out weeks sooner.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto bg-navy text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-navy-light transition-all shadow-xl hover:shadow-navy/20"
              >
                Get Prepped - £249
                <ArrowRight size={20} />
              </button>
              <a href="#problem" className="text-navy font-bold hover:underline flex items-center gap-2 px-6 py-4">
                Why sales take 20 weeks
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-navy mb-8">Why flat sales take 20 weeks.</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-navy mb-2">Solicitors are reactive</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Leasehold sales take 14 to 20 weeks on average. That is 4 to 8 weeks longer than a house. The reason is simple. Solicitors are reactive. They wait for the buyer's lawyer to ask a question before they look for the answer.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-navy mb-2">The waiting loop</h4>
                    <p className="text-slate-600 leading-relaxed">
                      This creates a waiting loop. You wait for the agent, the agent waits for the landlord, and the whole chain stalls. Many sales fail because people simply run out of patience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="text-2xl font-serif font-bold text-navy mb-6">The Cost of Waiting</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Average Flat Sale</span>
                  <span className="font-bold text-red-600">20 Weeks</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Average House Sale</span>
                  <span className="font-bold text-navy">12 Weeks</span>
                </div>
                <div className="p-4 bg-navy text-white rounded-xl text-center">
                  <p className="text-sm font-bold">The "Leasehold Gap": 8 Weeks of Delay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section: Prepped Seller Assistant */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-navy/5 text-navy rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} /> Meet your assistant
            </div>
            <h2 className="text-5xl font-serif font-bold text-navy">Prepped Seller Assistant</h2>
            <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
              Our AI assistant helps you get your information together before you even find a buyer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-navy text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">Guided gathering</h3>
              <p className="text-slate-600 leading-relaxed">
                We tell you exactly what is needed. We show you where to get it, whether it is from the Land Registry or your managing agent.
              </p>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-navy text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">AI Check</h3>
              <p className="text-slate-600 leading-relaxed">
                The AI looks at your files. It checks if they are valid and complete. No more documents being sent back weeks later.
              </p>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-navy text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">Speed</h3>
              <p className="text-slate-600 leading-relaxed">
                Getting your management pack ready early can save 2 to 6 weeks of waiting. You become the most prepared person in the chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role of the Tool & Emotional Benefits */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-xl font-serif font-bold text-navy mb-4 flex items-center gap-2">
                  <Scale size={24} className="text-navy" /> A partner for your preparation
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  This tool does not replace your solicitor. You still need one to handle the legal transfer. But by using the assistant, you ensure your solicitor has everything they need on day one. It is a tool to help you work with them more effectively.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-xl font-serif font-bold text-navy mb-4 flex items-center gap-2">
                  <UserCheck size={24} className="text-navy" /> Peace of mind
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  You will know exactly what is happening. You can feel confident that you have done your bit to keep the sale moving. No more guessing or waiting for updates that never come.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-navy rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-3xl font-serif font-bold mb-8">Ready to move?</h3>
                <p className="text-navy-light text-lg mb-10 leading-relaxed">
                  One simple payment gives you full access to the assistant and your secure document vault.
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-10">
                  <span className="text-4xl font-bold">£249</span>
                  <span className="text-navy-light ml-2">one-off payment</span>
                </div>
                <button 
                  onClick={onStart}
                  className="w-full bg-white text-navy px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  Get Prepped - £249
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy rounded flex items-center justify-center">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <span className="text-xl font-serif font-bold text-navy">Prepped Seller</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            <a href="https://PreppedSeller.app" className="hover:text-navy">PreppedSeller.app</a>
            <a href="#" className="hover:text-navy">Privacy Policy</a>
            <a href="#" className="hover:text-navy">Terms of Service</a>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 Prepped Seller. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
