
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import ProjectCard from "./ProjectCards";

interface Project {
    id: string;
    name: string;
    previewUrl: string;
    deployedUrl?: string;
    createdAt: string;
    staus: string;
}

const PROJECTS_PER_PAGE = 6;

export default function ProjectsGrid() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        fetchProjects();
    }, [])

    async function fetchProjects() {
        try {
            const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/project/list`, {
                credentials: "include"
            });

            const data = await res.json();

            if (data.success) {
                setProjects(data.projects);
            }
            else {
                setError(data.message || "Failed to fetch projects");
            }
        } catch (err) {
            setError("Failed to fetch Projects");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
            const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/project/${id}`, {
                method: "DELETE",
                credentials: "include"
            })

            const data = await res.json();

            if (data.success) {
                setProjects((prev) => prev.filter((p) => p.id !== id));

                const remainingPages = projects.length - 1;
                const maxPage = Math.ceil(remainingPages / PROJECTS_PER_PAGE);
                if (currentPage > maxPage && maxPage > 0) {
                    setCurrentPage(maxPage)
                }
            } else {
                alert(data.message || "Failed to delete project");
            }
        } catch (err) {
            alert("Failed to delete project")
        }

    }

    function handleClick(id: string) {
        router.push(`/playground/${id}`);
    }

    //pagination
    const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    const endIndex = startIndex + PROJECTS_PER_PAGE;
    const currentProjects = projects.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-neutral-500 border-t-neutral-200 rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-neutral-400">
                <p>{error}</p>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-neutral-400 text-lg">No projects yet</p>
                <p className="text-neutral-500 text-sm mt-2">
                    Use the input above to create your first project
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProjects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        id={project.id}
                        name={project.name}
                        deployedUrl={project.deployedUrl}
                        previewUrl={project.previewUrl}
                        onDelete={handleDelete}
                        onClick={handleClick}
                    />
                ))}
            </div>
            {/* pagination */}
            <Pagination className="mt-8">
                <PaginationContent className="gap-2">
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={`text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 ${currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
                                }`}
                        />
                    </PaginationItem>

                    {(() => {
                        const maxVisible = 3;
                        let start = Math.max(1, currentPage - 1);
                        let end = Math.min(totalPages, currentPage + 1);
                        if (end - start + 1 < maxVisible && totalPages >= maxVisible) {
                            if (start === 1) end = Math.min(3, totalPages);
                            else { end = totalPages; start = Math.max(1, end - 2); }
                        }
                        const items: React.ReactNode[] = [];
                        if (start > 1) {
                            items.push(
                                <PaginationItem key={1}>
                                    <PaginationLink href="#" isActive={currentPage === 1} onClick={(e) => { e.preventDefault(); setCurrentPage(1); }} className="cursor-pointer border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800">1</PaginationLink>
                                </PaginationItem>
                            );
                            if (start > 2) items.push(<PaginationItem key="ellipsis-left"><PaginationEllipsis className="text-neutral-500" /></PaginationItem>);
                        }
                        for (let p = start; p <= end; p++) {
                            items.push(
                                <PaginationItem key={p}>
                                    <PaginationLink
                                        href="#"
                                        isActive={p === currentPage}
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(p); }}
                                        className={`cursor-pointer border border-neutral-700 ${p === currentPage ? "bg-neutral-200 text-neutral-900 hover:bg-neutral-300" : "text-neutral-300 hover:text-white hover:bg-neutral-800"}`}
                                    >
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        }
                        if (end < totalPages) {
                            if (end < totalPages - 1) items.push(<PaginationItem key="ellipsis-right"><PaginationEllipsis className="text-neutral-500" /></PaginationItem>);
                            items.push(
                                <PaginationItem key={totalPages}>
                                    <PaginationLink href="#" isActive={currentPage === totalPages} onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }} className="cursor-pointer border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800">{totalPages}</PaginationLink>
                                </PaginationItem>
                            );
                        }
                        return items;
                    })()}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={`text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 ${currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-40" : "cursor-pointer"
                                }`}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}