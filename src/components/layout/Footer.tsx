import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Resume Builder', href: '/builder' },
      { name: 'ATS Optimizer', href: '/builder/ats' },
      { name: 'Pricing', href: '/pricing' },
    ],
    company: [
      { name: 'Contact', href: 'mailto:support@prepdunya.com' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' },
    ],
    social: [] as { name: string; href: string; icon: React.ReactNode }[],
  };

  return (
    <footer className="relative bg-white border-t border-gray-100">
      {/* Top gradient line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.03] via-violet-500/[0.02] to-transparent pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="inline-flex mb-4">
              <div className="inline-flex items-center h-9 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/20">
                <span className="font-extrabold text-base tracking-tight text-amber-300 drop-shadow-sm">JD</span>
                <span className="font-bold text-base tracking-tight text-white ml-0.5">sync</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 mb-4">
              Create professional, ATS-optimized resumes with AI-powered assistance.
              Stand out in your job search.
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label={item.name}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} JDsync. All rights reserved.
            </p>
            <a
              href="mailto:support@prepdunya.com"
              className="text-sm text-gray-400 hover:text-indigo-600 transition-colors mt-4 md:mt-0"
            >
              support@prepdunya.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
