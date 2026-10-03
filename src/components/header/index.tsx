import { Link } from "@tanstack/react-router"
import { useIsFetching } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { NavBar } from "../navbar"
import { Menu } from "./menu"
import { currentSourcesAtom, goToTopAtom } from "~/atoms"
import { useToast } from "~/hooks/useToast"

function Bookmark() {
  const toast = useToast()

  const handleBookmark = useCallback(() => {
    const title = document.title || "新闻早知道 - 实时热点聚合"
    const url = window.location.href

    // 尝试调用浏览器原生收藏或通用快捷键提醒
    try {
      if ((window as any).external && "AddFavorite" in (window as any).external) {
        (window as any).external.AddFavorite(url, title)
        return
      }
    } catch {
      // 忽略失败，向下执行
    }

    const isMac = navigator.userAgent.toLowerCase().includes("mac")
    const shortcut = isMac ? "⌘ + D" : "Ctrl + D"

    // 复制当前网址到剪贴板作为备用贴心体验
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {})
    }

    toast(`请按 ${shortcut} 将本站加入书签收藏夹！`, {
      type: "success",
      duration: 4000,
    })
  }, [toast])

  return (
    <button
      type="button"
      title="收藏本站 (Ctrl+D)"
      aria-label="收藏本站"
      className="i-ph:bookmark-simple-duotone btn hover:scale-110 active:scale-95 transition-all text-xl"
      onClick={handleBookmark}
    />
  )
}

function GoTop() {
  const { ok, fn: goToTop } = useAtomValue(goToTopAtom)
  return (
    <button
      type="button"
      title="Go To Top"
      className={$("i-ph:arrow-fat-up-duotone", ok ? "op-50 btn" : "op-0")}
      onClick={goToTop}
    />
  )
}

function Github() {
  return (
    <button type="button" title="Github" className="i-ph:github-logo-duotone btn" onClick={() => window.open(Homepage)} />
  )
}

function Refresh() {
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const refreshAll = useCallback(() => refresh(...currentSources), [refresh, currentSources])

  const isFetching = useIsFetching({
    predicate: (query) => {
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && currentSources.includes(id)) || type === "entire"
    },
  })

  return (
    <button
      type="button"
      title="Refresh"
      className={$("i-ph:arrow-counter-clockwise-duotone btn", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
      onClick={refreshAll}
    />
  )
}

export function Header() {
  return (
    <>
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-3 group select-none">
          <div className="h-10 w-10 flex-shrink-0 bg-cover rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105" title="新闻早知道" style={{ backgroundImage: "url(/icon.svg)" }} />
          <span className="text-xl md:text-2xl font-bold tracking-wider whitespace-nowrap text-neutral-800 dark:text-neutral-100 group-hover:text-primary transition-colors font-sans">
            新闻早知道
          </span>
        </Link>
      </div>
      <div className="hidden md:flex justify-center flex-1 mx-4">
        <NavBar />
      </div>
      <div className="flex items-center gap-3 text-xl text-primary-600 dark:text-primary">
        <Bookmark />
        <GoTop />
        <Refresh />
      </div>
    </>
  )
}
