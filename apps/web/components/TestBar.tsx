"use client"
import Link from "next/link";
import LogoIcon from "./ui/logo";
import { useState } from "react";
import { HamburgerIcon } from "lucide-react";
import { IoClose } from "react-icons/io5";

export default function TestBar(){

    const links = [
        {name: "Home", href: "/"},
        {name: "Contact", href: "/contact"},
        {name: "About", href: "/about"}
    ]

    const[open, setOpen] = useState(false);

    return(
        <div className="relative">
            <nav className=" flex bg-neutral-800 p-4 max-w-4xl items-center justify-between mx-auto rounded-md">
                <div className="h-6 w-6 text-white">
                    <LogoIcon />
                </div>
                <div className="hidden md:flex text-neutral-400 gap-2">
                    {links.map((link, index) => <Link className="hover:text-white"
                    href={link.href} key={index} >{link.name}</Link>)}
                </div>
                <button onClick={()=> setOpen(!open)}
                 className="md:hidden text-white">
                   {open ? <IoClose /> : <HamburgerIcon />}
                </button>

               {open && <div className="absolute inset-x-0 mx-auto rounded-md bg-neutral-800 top-16">
               <div className="md:hidden flex flex-col mx-auto p-4">
                    {links.map((link, index)=> <Link className="hover:text-white"
                    href={link.href} key={index}>{link.name}</Link>)}
                </div>
                </div>}
            </nav>
        </div>
    )
}