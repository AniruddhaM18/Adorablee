"use client"
import { useState } from "react";
import LogoIcon from "./ui/logo";
import Link from "next/link";
import { IoClose } from "react-icons/io5";
import { HamburgerIcon } from "lucide-react";


export default function NanoBar(){
    const links = [
        {name: "Home", href:"/home"},
        {name: "Contact", href: "/contact"},
        {name: "About", href: "/about"}
    ]
    const[open, setOpen] = useState(false);
    return(
        <div className="relative">
            <nav className="flex bg-neutral-200 p-4 items-center justify-between mx-auto rounded-md">
                <div className="h-7 w-7 text-neutral-800">
                    <LogoIcon />
                </div>
                <div className="hidden md:flex gap-2 text-neutral-600">
                    {links.map((link, index) => <Link className="hover:text-neutral-800"
                    href={link.href} key={index}>{link.name}</Link>)}
                </div>
                <button onClick={()=> setOpen(!open)} className="md:hidden">
                    {open ? <IoClose /> : <HamburgerIcon />}
                </button>
                <div className="">

                </div>
            </nav>
        </div>
    )
}