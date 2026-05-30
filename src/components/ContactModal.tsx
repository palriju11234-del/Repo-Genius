import React, { useState } from 'react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const emails = [
    'palriju11234@gmail.com',
    'tkamleair1@gmail.com',
    'sayakadak096@gmail.com',
    'urjitapaul06@gmail.com',
    'sudiptabakshi34@gmail.com'
  ];

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => {
      setCopiedEmail(null);
    }, 1500);
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const emailAllUrl = `mailto:${emails.join(',')}`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/15 backdrop-blur-[5px] z-50 transition-opacity duration-300 animate-fade-rise"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none pointer-events-none">
        <div className="glassmorphic w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-black/5 pointer-events-auto animate-fade-rise max-h-[90vh] overflow-y-auto bg-white/90">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black font-sans tracking-tight">
                Reach Us
              </h2>
              <p className="text-xs text-[#6F6F6F] font-sans mt-0.5">
                Get in touch with the makers of RepoGenius
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Email List */}
          <div className="space-y-3 mb-6">
            {emails.map((email, idx) => (
              <div 
                key={email}
                className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.01] hover:bg-black/[0.03] border border-black/5 hover:border-black/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm">
                    {getInitials(email)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#6F6F6F] font-bold uppercase tracking-wider font-mono">
                      Maker #{idx + 1}
                    </span>
                    <a 
                      href={`mailto:${email}`}
                      className="text-sm font-semibold text-black hover:text-black/75 transition-colors font-sans truncate max-w-[170px] xs:max-w-none"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(email)}
                    className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#6F6F6F] hover:text-black"
                    title="Copy Email Address"
                  >
                    {copiedEmail === email ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Email All Primary Action */}
          <a 
            href={emailAllUrl}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 bg-black text-white hover:scale-103 active:scale-[0.98] transition-transform duration-300 font-semibold text-sm cursor-pointer shadow-md text-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email All Makers</span>
          </a>

        </div>
      </div>
    </>
  );
};
