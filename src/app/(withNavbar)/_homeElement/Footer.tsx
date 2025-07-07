import Image from 'next/image';
import React, { useState, useEffect } from 'react';
// Importing specific icons from lucide-react
import {
  Facebook,
  Instagram,
  Twitter,
  Github,
  Dribbble,
  MonitorPlay // Using MonitorPlay as a placeholder for the Flowbite-like logo, or any suitable icon
} from 'lucide-react';

// Define a type for navigation link items
interface FooterLink {
  name: string;
  href: string;
}

// Define a type for a section of footer links (e.g., About, Follow Us, Legal)
interface FooterSection {
  title: string;
  links: FooterLink[];
}

// Define a type for social media links
interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode; // A React node for the icon (e.g., Lucide icon component)
}

const Footer: React.FC = () => {
  const footerSections: FooterSection[] = [
    {
      title: 'ABOUT',
      links: [
        { name: 'IEDC', href: '#' },
        { name: 'Department', href: '#' },
      ],
    },
    {
      title: 'FOLLOW US',
      links: [
        { name: 'Github', href: '#' },
        { name: 'Discord', href: '#' },
      ],
    },
    {
      title: 'LEGAL',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms & Conditions', href: '#' },
      ],
    },
  ];

  const socialLinks: SocialLink[] = [
    { name: 'Facebook', href: '#', icon: <Facebook size={20} /> },
    { name: 'Instagram', href: '#', icon: <Instagram size={20} /> },
    { name: 'Twitter', href: '#', icon: <Twitter size={20} /> },
    { name: 'Github', href: '#', icon: <Github size={20} /> },
    { name: 'Dribbble', href: '#', icon: <Dribbble size={20} /> },
  ];

  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-400 font-inter py-8 px-4 sm:px-6 lg:px-8 rounded-t-lg shadow-lg w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-col lg:flex-col xl:flex-row justify-between items-center xl:items-start gap-8 pb-8 md:pb-6">
        {/* Logo and Company Name/Description */}
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left gap-4 md:gap-6 w-full xl:w-2/5">
          <div className="flex items-center justify-center xl:justify-start gap-3">
            {/* Using Next.js Image component for the logo */}
            {/* The size-full and w-auto on Image are problematic. Better to explicitly set width/height for next/image */}
            <Image
              src={"/iedc-logo.jpg"} // Using a placeholder for now as you referred to a local image path. Replace with your actual logo.
              alt="IEDC Logo"
              width={100} // Set a fixed width for the image
              height={100} // Set a fixed height for the image
              className="rounded-full object-cover" // Ensure it's a circle and covers the area
            />
            <div className="flex flex-col items-center xl:items-start justify-center gap-1">
              <span className="font-bold text-xl  text-white leading-tight">
                Innovation and Entrepreneurship Development Cell (I.E.D.C)
              </span>
              <span className="font-semibold text-xs sm:text-sm text-gray-300 leading-snug">
                Department of Computer Science and Engineering (Internet of
                Things, Cyber Security & Blockchain Technology)
              </span>
            </div>
          </div>
        </div>

        {/* Link Sections - Now using Flexbox */}
        <div className="flex flex-wrap justify-center sm:justify-between xl:justify-end gap-x-12 gap-y-8 mt-8 md:mt-0 w-full xl:w-3/5">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col items-center sm:items-start min-w-[120px]">
              <h3 className="text-sm font-semibold text-white uppercase mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="hover:underline text-gray-400 hover:text-gray-200 transition-colors duration-200"
                      aria-label={link.name}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Rule */}
      <hr className="my-6 border-gray-700 sm:mx-auto lg:my-8" />

      {/* Bottom Section: Copyright and Social Icons */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-2 text-center sm:text-left">
        <span className="text-sm text-gray-500 sm:text-center">
          &copy; {currentYear} <a href="#" className="hover:underline">IEDC</a>. All Rights Reserved.
        </span>
        <div className="flex mt-4 sm:mt-0 space-x-5 justify-center sm:justify-end">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors duration-200"
              aria-label={`Link to ${link.name}`}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
