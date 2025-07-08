"use client";

import React, { useEffect } from "react";
import {
  Airplay,
  Check,
  ChevronUp,
  Code,
  Contact,
  Home,
  Info,
  Search,
  SquareTerminal,
  Target,
  Terminal,
  Upload,
  UploadIcon,
  User,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenuElement } from "./NavElement";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { IconDashboard } from "@tabler/icons-react";

const UemLogo = () => (
  <div className="md:h-24 h-14 w-14 md:w-24 flex items-center justify-center font-bold text-gray-700 rounded-lg">
    <Image
      src="/uem.png"
      alt="UEM Logo"
      width={100}
      height={100}
      className=""
    />
  </div>
);
const IemLogo = () => (
  <div className="md:h-24 h-14 w-14 md:w-24  flex items-center justify-center font-bold text-gray-700 rounded-lg">
    <Image
      src="/iem-logo.png"
      alt="IEM Logo"
      width={100}
      height={100}
      className=""
    />
  </div>
);

export interface NavbarDataType {
  title: string;
  logo: React.ReactNode;
  subElements: {
    title: string;
    href: string;
    description: string;
    logo: React.ReactNode;
  }[];
}

const NavbarData: NavbarDataType[] = [
  {
    title: "About Us",
    logo: <Info className="h-5 w-5 inline" />,
    subElements: [
      {
        title: "Our Mission",
        href: "/guide/mission",
        description: "Learn about our mission and vision.",
        logo: <Target className="h-5 w-5" />,
      },
      {
        title: "Our Team",
        href: "/guide/team",
        description: "Meet our dedicated team members.",
        logo: <User2 className="h-5 w-5" />,
      },
      {
        title: "About Us",
        href: "/guide/aboutus",
        description: "Discover more about our organization.",
        logo: <Info className="h-5 w-5" />,
      },
      {
        title: "Research Area",
        href: "/guide/research",
        description: "Explore our research initiatives and projects.",
        logo: <Target className="h-5 w-5" />,
      },
      {
        title: "Collaborate with Us",
        href: "/guide/collaborate",
        description: "Find out how to collaborate with us on projects.",
        logo: <User className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Projects",
    logo: <Terminal className="h-5 w-5" />,
    subElements: [
      {
        title: "Ongoing Projects",
        href: "/projects/ongoing",
        description: "Explore our ongoing projects and initiatives.",
        logo: <UploadIcon className="h-5 w-5" />,
      },
      {
        title: "Completed Projects",
        href: "/projects/completed",
        description: "View our completed projects and their outcomes.",
        logo: <Check className="h-5 w-5" />,
      },
    ],
  },
];

const Navbar: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };
  const {data:session} = useSession();
  useEffect(()=>{
    console.log("Session Data: ", session);
  },[session])

  return (
    <nav className=" shadow-lg sticky top-0 z-50 w-screen bg-white">
      {/* Desktop and Tablet Layout (>md) */}
      <div className="hidden md:block w-full">
        {/* Upper div for logos and university names */}
        <div className=" w-full  px-4 py-1 flex items-center justify-between border-b border-gray-200">
          {/* Left: UEM Logo and text */}
          <div className="">
            <UemLogo />
          </div>
          <div className="flex  justify-center items-center gap-6">
            <div className="md:h-24 h-14 w-14 md:w-24  flex items-center justify-center font-bold text-gray-700 rounded-full overflow-hidden">
              <Image
                src="/iedc-logo.jpg"
                alt="IEDC Logo"
                width={100}
                height={100}
                className="rounded-full object-cover w-full h-full aspect-square  "
              />
            </div>

            <div className="flex flex-col  items-start justify-center gap-2 ">
              <span className="font-bold text-2xl text-gray-800">
                Innovation and Entrepreneurship Development Cell (I.E.D.C)
              </span>

              <span className="font-semibold text-sm text-gray-800">
                Department of Computer Science and Engineering (Internet of
                Things, Cyber Security & Blockchain Technology)
              </span>
            </div>
          </div>
          {/* Right: IEM Logo */}
          <div>
            <IemLogo />
          </div>
        </div>

        {/* Lower div for navigation, IEDC, search, and user icons */}
        <div className=" w-full px-4 py-1 flex items-center justify-between">
          {/* Left: IEDC Logo Area and Navigation elements */}
          <div className="flex items-center space-x-8 justify-between w-full">
            <div className="h-full aspect-square bg-blue-300">a</div>
            <NavigationMenuElement data={NavbarData} />
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              {
                session?.user?(


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"><Image src={session.user.image||"/default-image.png"} alt={session.user.name||"logo"} width={50} height={50} className="" /></div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>

                      <DropdownMenuItem >

                        <Link href="/dashboard"><IconDashboard className="inline-block mr-3 size-6"/>Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem ><Link href="/dashboard/paper/upload"><Upload className="inline-block mr-3 size-6"/>Upload Research Paper</Link></DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem ><Link href="/dashboard/paper/project"><Upload className="inline-block mr-3 size-6"/>Upload Ongoing Project</Link></DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem onClick={() => signOut()} className="bg-red-400 border border-black rounded-md">Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                ):(
   <Button variant="ghost" size="icon">
                <Link href={'/signup'}>
                <User className="h-5 w-5" />
                </Link>
              </Button>
                )
              }
           
            </div>
          </div>

          {/* Right: Search and User Icons */}
        </div>
      </div>

      {/* Mobile Layout (<md) */}
      <div className="md:hidden">
        {/* Top div for logos */}
        <div className="w-full mx-auto px-4 py-1 flex items-center justify-between">
          <div className="flex  justify-between items-center w-full">
            <UemLogo />

            <div className="w-14 h-14  rounded-full flex-shrink-0 overflow-hidden">
              <Image
                src="/iedc-logo.jpg"
                alt="IEDC Logo"
                width={100}
                height={100}
                className="w-full h-full object-contain"
              />
            </div>
            <IemLogo />
          </div>
        </div>

        {/* Bottom nav bar for navigation and icons */}
        <div className="bg-white shadow-lg border-t border-gray-200 fixed bottom-0 left-0 right-0 z-40">
          <div className=" mx-auto px-4 py-1 flex items-center justify-between">
            <div className="flex items-center justify-center">
              <Home className="h-7 w-7" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleToggle}>
                <Airplay className="h-7 w-7 inline-block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Billing
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Keyboard shortcuts
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Invite users
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Email</DropdownMenuItem>
                        <DropdownMenuItem>Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>More...</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    New Team
                    <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>GitHub</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuItem disabled>API</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleToggle}>
                <SquareTerminal
                  className={`w-7 h-7 inline-block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Billing
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Keyboard shortcuts
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Invite users
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Email</DropdownMenuItem>
                        <DropdownMenuItem>Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>More...</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    New Team
                    <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>GitHub</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuItem disabled>API</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Search className="h-7 w-7" />

            <User className="h-7 w-7" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
