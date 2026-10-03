import process from "node:process"
import { XMLParser } from "fast-xml-parser"
import type { NewsItem } from "@shared/types"

interface RSSItem {
  title?: string
  link?: string
  description?: string
  pubDate?: string
  guid?: string | {
    "#text"?: string
    "$text"?: string
  }
}

async function fetchByCurl(url: string) {
  if (process.env.CF_PAGES) return ""

  try {
    const { execFile } = await import("node:child_process")
    const { promisify } = await import("node:util")
    const execFileAsync = promisify(execFile)
    const { stdout } = await execFileAsync("curl", [
      "-L",
      "--max-time",
      "15",
      "-A",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      url,
    ], {
      maxBuffer: 1024 * 1024,
    })
    return stdout
  } catch {
    return ""
  }
}

function getText(value: any) {
  if (!value) return ""
  if (typeof value === "string") return value
  return value["#text"] || value.$text || ""
}

// 当 Freebuf 开启阿里云 WAF 人机验证阻断时，备用获取国内一流网络安全资讯（安客安全 / 阿里先知社区）
async function fetchSecurityFallback(): Promise<NewsItem[]> {
  try {
    // 方案一：安全客官方精选公开 API
    const res = await myFetch<any>("https://api.anquanke.com/data/v1/posts?size=25")
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        url: `https://www.anquanke.com/post/id/${item.id}`,
        pubDate: item.date,
        extra: {
          hover: item.desc || item.title,
        },
      }))
    }
  } catch (e) {
    console.error("Anquanke fallback failed", e)
  }

  try {
    // 方案二：阿里云先知安全技术社区 Atom Feed
    const feedXml = await myFetch<string>("https://xz.aliyun.com/feed", {
      responseType: "text" as any,
    })
    if (feedXml) {
      const xml = new XMLParser({
        attributeNamePrefix: "",
        textNodeName: "#text",
        ignoreAttributes: false,
      })
      const result = xml.parse(feedXml)
      const entries = result?.feed?.entry
      const list = Array.isArray(entries) ? entries : entries ? [entries] : []
      const items = list.map((e: any) => ({
        id: getText(e.id) || getText(e.link?.href),
        title: getText(e.title),
        url: e.link?.href || getText(e.id),
        pubDate: e.updated,
      })).filter((item: any) => item.id && item.title && item.url)
      if (items.length > 0) return items
    }
  } catch (e) {
    console.error("Aliyun XZ fallback failed", e)
  }

  return []
}

export default defineSource(async () => {
  const url = "https://www.freebuf.com/feed"
  let xmlText = ""
  try {
    xmlText = await myFetch<string>(url, {
      responseType: "text" as any,
    }).catch(() => fetchByCurl(url))
  } catch {
    xmlText = await fetchByCurl(url)
  }

  if (xmlText && !xmlText.includes("aliyun_waf")) {
    try {
      const xml = new XMLParser({
        attributeNamePrefix: "",
        textNodeName: "#text",
        ignoreAttributes: false,
      })
      const result = xml.parse(xmlText)
      const items = result?.rss?.channel?.item
      const list: RSSItem[] = Array.isArray(items) ? items : items ? [items] : []

      const news = list.map<NewsItem>((item) => {
        const link = getText(item.link)
        return {
          id: getText(item.guid) || link,
          title: getText(item.title),
          url: link,
          pubDate: item.pubDate,
          extra: {
            hover: getText(item.description),
          },
        }
      }).filter(item => item.id && item.title && item.url)

      if (news.length) return news
    } catch {
      // 解析失败时向下走安全资讯降级
    }
  }

  // 被阿里云 WAF 拦截或者原站 RSS 异常时，降级获取国内顶级网络安全即时热点
  const fallbackNews = await fetchSecurityFallback()
  if (fallbackNews.length) {
    return fallbackNews
  }

  throw new Error("Cannot fetch freebuf feed or fallback security news")
})
