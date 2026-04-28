import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, BookOpen, ExternalLink, MapPin, FileText, BadgePoundSterling, ShieldAlert, Info, Users, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface GlossaryTermProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  whereToGet: string;
  whyNeeded: string;
  ifAbsent: string;
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({ id, title, icon, whereToGet, whyNeeded, ifAbsent }) => (
  <div id={id} className="scroll-mt-24 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 transition-all hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-2xl font-serif font-bold text-navy">{title}</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-100">
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Where to get it</h4>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/40 mt-1.5 shrink-0" />
            <p>{whereToGet}</p>
          </li>
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Why it’s needed</h4>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/40 mt-1.5 shrink-0" />
            <p>{whyNeeded}</p>
          </li>
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gold uppercase tracking-wider">If absent</h4>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/40 mt-1.5 shrink-0" />
            <p>{ifAbsent}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export const Glossary: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy tracking-tight">Understanding Your Sale</h1>
          <p className="text-slate-500">
            A comprehensive guide to the documents and terms required for a smooth property transaction. 
            Direct and authoritative advice for every seller.
          </p>
        </header>

        <div className="space-y-8">
          <GlossaryTerm 
            id="uprn"
            title="UPRN"
            icon={<MapPin size={24} />}
            whereToGet="Find your UPRN on the official FindMyAddress website or your local council tax bill."
            whyNeeded="It acts as a unique digital fingerprint for your property, ensuring all legal records match correctly."
            ifAbsent="The sale can still proceed, but manual address matching increases the risk of administrative errors."
          />

          <GlossaryTerm 
            id="ground-lease-holder"
            title="Ground Lease Holder"
            icon={<Users size={24} />}
            whereToGet="Check your lease or your last ground rent invoice for their name."
            whyNeeded="They own the land and have the legal right to collect ground rent and enforce lease terms."
            ifAbsent="The buyer's solicitor cannot confirm who has the right to collect rent, blocking the sale."
          />

          <GlossaryTerm 
            id="management-company"
            title="Management Company"
            icon={<Users size={24} />}
            whereToGet="Look for the company name on your service charge bills or your Share Certificate."
            whyNeeded="Responsible for the upkeep of the building and shared areas. Often resident-led."
            ifAbsent="Without a clear management structure, lenders will refuse to provide a mortgage on the property."
          />

          <GlossaryTerm 
            id="managing-agent"
            title="Managing Agent"
            icon={<Users size={24} />}
            whereToGet="The firm that sends you service charge invoices and manages day-to-day repairs."
            whyNeeded="They handle the administrative side of the building and provide the essential Management Pack."
            ifAbsent="You will need to contact the Management Company directors directly to obtain the required information."
          />

          <GlossaryTerm 
            id="sc-accounts"
            title="Service Charge Accounts"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="Download from your resident portal or request from your Managing Agent."
            whyNeeded="They show how your money was spent and the financial health of the building management."
            ifAbsent="Buyers will assume the building is poorly managed or has hidden debts, leading to price renegotiations."
          />

          <GlossaryTerm 
            id="sc-budget"
            title="Service Charge Budget"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="Usually sent to you at the start of the financial year by your Managing Agent."
            whyNeeded="It outlines the expected costs for the coming year, including any planned increases."
            ifAbsent="The buyer cannot plan for future costs, which can cause them to pull out of the purchase."
          />

          <GlossaryTerm 
            id="ground-rent-receipt"
            title="Ground Rent Receipt"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="Look for a receipt or an account statement from your Freeholder or their agent."
            whyNeeded="Proof that you are up to date with payments. Overdue ground rent can lead to lease forfeiture."
            ifAbsent="The sale cannot complete until you prove all ground rent is paid in full to the current date."
          />

          <GlossaryTerm 
            id="reserve-fund"
            title="Reserve Fund"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="The total amount held is usually listed in the latest Service Charge Accounts."
            whyNeeded="A 'sinking fund' for major future repairs like roof work or lift replacements."
            ifAbsent="If there is no fund, the buyer may face huge 'one-off' bills shortly after moving in."
          />

          <GlossaryTerm 
            id="asbestos-survey"
            title="Communal Asbestos Survey"
            icon={<ShieldAlert size={24} />}
            whereToGet="The Managing Agent must have a copy of this for the communal areas of the building."
            whyNeeded="A legal requirement for buildings built before 2000 to ensure safety for residents and contractors."
            ifAbsent="Lenders may refuse to lend until a survey is carried out, causing months of delays."
          />

          <GlossaryTerm 
            id="eicr"
            title="Communal Electrical (EICR)"
            icon={<ShieldAlert size={24} />}
            whereToGet="Request the latest communal area certificate from your Managing Agent."
            whyNeeded="Ensures the shared electrical systems (hallway lights, fire alarms) are safe and compliant."
            ifAbsent="Safety concerns in shared areas can lead to a mortgage refusal for the entire building."
          />

          <GlossaryTerm 
            id="insurance"
            title="Building Insurance Policy"
            icon={<ShieldAlert size={24} />}
            whereToGet="Your Managing Agent should provide the current schedule and summary of cover."
            whyNeeded="Proof that the building is fully insured against fire, flood, and other major risks."
            ifAbsent="No mortgage will be granted without proof of building insurance. It is a total sale blocker."
          />

          <GlossaryTerm 
            id="management-articles"
            title="Articles of Association"
            icon={<FileText size={24} />}
            whereToGet="Check your original purchase documents or download from Companies House."
            whyNeeded="The governing rules for the Management Company, outlining how decisions are made."
            ifAbsent="The buyer's solicitor cannot verify the company's legal standing or your rights as a member."
          />

          <GlossaryTerm 
            id="transfer-fees"
            title="Notice of Transfer Fees"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="Listed in the Management Pack or on the Managing Agent's website."
            whyNeeded="The fees charged by the agent to update their records with the new owner's details."
            ifAbsent="The buyer may be hit with unexpected costs on completion, causing friction and delays."
          />

          <GlossaryTerm 
            id="solicitor-pack"
            title="The Solicitor Pack"
            icon={<Send size={24} />}
            whereToGet="Generated automatically by this platform once all your documents are verified."
            whyNeeded="A complete, verified set of Material Information that your solicitor can use to start the legal process immediately."
            ifAbsent="Your solicitor will have to manually request and verify every document, adding weeks to the transaction."
          />

          <GlossaryTerm 
            id="ta6"
            title="TA6: Property Information Form"
            icon={<FileText size={24} />}
            whereToGet="Your solicitor will provide the official Law Society form for you to complete."
            whyNeeded="It provides the buyer with critical details about boundaries, disputes, and planning permissions."
            ifAbsent="Buyers may withdraw if they feel information is being withheld, leading to significant delays."
          />

          <GlossaryTerm 
            id="ta7"
            title="TA7: Leasehold Information Form"
            icon={<FileText size={24} />}
            whereToGet="Provided by your solicitor alongside the TA6 for leasehold properties."
            whyNeeded="It covers lease-specific details such as ground rent, service charges, and management company info."
            ifAbsent="The buyer's solicitor cannot verify the leasehold obligations, stalling the entire legal process."
          />

          <GlossaryTerm 
            id="ta10"
            title="TA10: Fittings and Contents Form"
            icon={<FileText size={24} />}
            whereToGet="Your solicitor will send this to you to list what is included in the sale price."
            whyNeeded="It prevents disputes on completion day by clearly stating which appliances and fixtures stay."
            ifAbsent="Arguments over missing items can lead to post-completion legal claims and financial penalties."
          />

          <GlossaryTerm 
            id="lease"
            title="The Lease"
            icon={<FileText size={24} />}
            whereToGet="Check your personal records or request a copy from the Land Registry for a small fee."
            whyNeeded="It is the primary contract between you and the freeholder, defining your rights and restrictions."
            ifAbsent="A missing lease is a total blocker. You must obtain a certified copy before the sale can proceed."
          />

          <GlossaryTerm 
            id="management-pack"
            title="Management Pack (LPE1)"
            icon={<BadgePoundSterling size={24} />}
            whereToGet="Request this from your Managing Agent or Management Company. They usually charge a fee."
            whyNeeded="It contains the last three years of accounts, insurance details, and any planned major works."
            ifAbsent="Lenders will not approve a mortgage without seeing the financial health of the building management."
          />

          <GlossaryTerm 
            id="fra"
            title="Fire Risk Assessment (FRA)"
            icon={<ShieldAlert size={24} />}
            whereToGet="The Managing Agent is legally required to hold a current FRA for the communal areas."
            whyNeeded="It proves the building meets safety standards, which is now a critical requirement for lenders."
            ifAbsent="Lenders may refuse to lend on the building, making it impossible for most buyers to purchase."
          />

          <GlossaryTerm 
            id="bsa"
            title="Leaseholder Deed (BSA 2022)"
            icon={<ShieldAlert size={24} />}
            whereToGet="You must complete this yourself, often with guidance from your solicitor."
            whyNeeded="Required under the Building Safety Act 2022 to determine if you are a 'qualifying' leaseholder for cost protections."
            ifAbsent="You may be held liable for full cladding or safety repair costs that should have been protected."
          />
        </div>

        <footer className="pt-12 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            This glossary provides general information for sellers. 
            Always consult your appointed solicitor for specific legal advice regarding your property sale.
          </p>
        </footer>
      </main>
    </div>
  );
};
