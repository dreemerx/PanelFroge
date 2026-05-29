import {
	Cog6ToothIcon,
	FilmIcon,
	PlusIcon,
	ChevronDownIcon,
	MoonIcon,
	SunIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "~/services/api";
import { useThemeStore } from "~/stores/themeStore";
import { useSettingsStore } from "~/stores/settingsStore";
import type { Project } from "~/types";
import { Button } from "~/components/ui/Button";
import { SvgIcon } from "~/components/ui/SvgIcon";

interface TopBarProps {
	onToggleAssets: () => void;
	onToggleHistory: () => void;
	assetsOpen?: boolean;
	historyOpen?: boolean;
	projectId?: number;
}

function ProjectDropdown({ currentId }: { currentId?: number }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const { data: projects } = useQuery({
		queryKey: ["projects"],
		queryFn: () => projectsApi.list(),
	});

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		if (open) document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const list = (projects ?? []) as Project[];

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex items-center gap-1 text-xs font-heading font-bold max-w-[180px] hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				aria-expanded={open}
				aria-haspopup="true"
			>
				<FilmIcon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
				<span className="truncate">{list.find((p) => p.id === currentId)?.title || "项目"}</span>
				<ChevronDownIcon className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
			</button>

			{open && (
				<div className="absolute left-0 top-full mt-1 w-64 bg-base-200 border border-base-300 rounded-lg shadow-forge z-50 py-1 max-h-80 overflow-y-auto backdrop-blur-sm">
					<Link
						to="/"
						onClick={() => setOpen(false)}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-base-content/50 hover:bg-base-300/50 transition-colors"
					>
						<SparklesIcon className="w-3 h-3" />
						首页 — 所有项目
					</Link>
					<div className="border-t border-base-300/50 my-1" />
					{list.map((p) => {
						const statusMap: Record<string, { label: string; cls: string }> = {
							draft: { label: "草稿", cls: "text-base-content/25" },
							planning: { label: "规划中", cls: "text-warning" },
							ready: { label: "完成", cls: "text-success" },
							superseded: { label: "已覆盖", cls: "text-base-content/15" },
						};
						const st = statusMap[p.status] ?? { label: p.status, cls: "text-base-content/25" };
						return (
							<Link
								key={p.id}
								to={`/projects/${p.id}`}
								onClick={() => setOpen(false)}
								className={`flex items-center justify-between px-3 py-1.5 text-xs hover:bg-base-300/50 transition-colors group ${p.id === currentId ? "bg-primary/8 text-primary font-bold" : ""}`}
							>
								<span className="truncate flex-1">{p.title}</span>
								<span className={`text-[10px] ml-1.5 flex-shrink-0 ${st.cls}`}>{st.label}</span>
							</Link>
						);
					})}
					<div className="border-t border-base-300/50 my-1" />
					<Link
						to="/"
						onClick={() => setOpen(false)}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:bg-base-300/50 transition-colors"
					>
						<PlusIcon className="w-3 h-3" />
						新建项目
					</Link>
				</div>
			)}
		</div>
	);
}

export function TopBar({
	onToggleAssets,
	onToggleHistory,
	assetsOpen,
	historyOpen,
	projectId,
}: TopBarProps) {
	const { theme, toggleTheme } = useThemeStore();
	const isDark = theme.endsWith("dark");
	const { openModal: openSettingsModal } = useSettingsStore();

	const btnCls = "flex items-center whitespace-nowrap !px-1.5 !min-h-0 !h-6 gap-1";
	const iconCls = "w-3.5 h-3.5";

	return (
		<header className="flex-shrink-0 flex items-center h-10 px-3 bg-base-200/80 border-b border-base-300/60 z-30 gap-3 backdrop-blur-sm">
			<div className="flex items-center gap-2">
				{projectId ? (
					<ProjectDropdown currentId={projectId} />
				) : (
					<Link to="/" className="flex items-center gap-1.5 font-comic text-lg text-primary font-bold tracking-wider">
						<svg width="20" height="20" viewBox="0 0 32 32" className="flex-shrink-0" aria-hidden="true">
							<defs>
								<linearGradient id="forge-nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#E8A830" />
									<stop offset="100%" stopColor="#D07840" />
								</linearGradient>
							</defs>
							<rect width="32" height="32" rx="6" fill="url(#forge-nav-grad)" />
							<path d="M8 8h6v4h-2v10h-4V8zm10 0h6v4h-2v10h-4V8z" fill="#1a1208" opacity="0.9" />
							<path d="M7 24h18v2H7z" fill="#1a1208" opacity="0.6" />
						</svg>
						PanelForge
					</Link>
				)}
			</div>

			<div className="flex-1" />

			<div className="flex items-center gap-1">
				<Button
					variant={assetsOpen ? "primary" : "ghost"}
					size="sm"
					className={btnCls}
					onClick={onToggleAssets}
					title="资产库"
				>
					<SvgIcon name="archive" size={14} />
					<span className="text-xs hidden sm:inline">资产</span>
				</Button>
				<Button
					variant={historyOpen ? "primary" : "ghost"}
					size="sm"
					className={btnCls}
					onClick={onToggleHistory}
					title="对话历史"
				>
					<SvgIcon name="clock-3" size={14} />
					<span className="text-xs hidden sm:inline">历史</span>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={btnCls}
					onClick={toggleTheme}
					aria-label={isDark ? "切换亮色" : "切换暗色"}
					title={isDark ? "切换亮色" : "切换暗色"}
				>
					{isDark ? <SunIcon className={iconCls} /> : <MoonIcon className={iconCls} />}
					<span className="text-xs hidden sm:inline">主题</span>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={btnCls}
					onClick={openSettingsModal}
					title="设置"
				>
					<Cog6ToothIcon className={iconCls} />
					<span className="text-xs hidden sm:inline">设置</span>
				</Button>
			</div>
		</header>
	);
}
