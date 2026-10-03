import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import { updatedSourceIds as _updatedSourceIds } from "./updated-sources"
import type { ColumnID, HiddenColumnID, Metadata, SourceID } from "./types"

export const columns = {
  china: {
    zh: "国内",
  },
  world: {
    zh: "国际",
  },
  tech: {
    zh: "科技",
  },
  finance: {
    zh: "财经",
  },
  sports: {
    zh: "体育",
  },
  focus: {
    zh: "关注",
  },
  realtime: {
    zh: "实时",
  },
  hottest: {
    zh: "最热",
  },
  updated: {
    zh: "更新",
  },
} as const

const updatedSourceIds = [..._updatedSourceIds] as SourceID[]

export const defaultOrderedSources: SourceID[] = [
  // 1、知乎、微博、参考消息（纯中文主流热点）
  "zhihu",
  "weibo",
  "cankaoxiaoxi",

  // 2、百度热搜、今日头条、腾讯新闻（纯中文综合）
  "baidu",
  "toutiao",
  "tencent",

  // 3、抖音、哔哩哔哩、腾讯视频（纯中文视频娱乐）
  "douyin",
  "bilibili-hot-search",
  "qqvideo",

  // 4、经济类 A（纯中文经济热点）：财联社、雪球、金十数据
  "cls-telegraph",
  "xueqiu-hotstock",
  "jin10",

  // 5、经济类 B（纯中文经济深度）：格隆汇、法布财经、财联社热门
  "gelonghui",
  "fastbull-express",
  "cls-hot",

  // 6、中文媒体与财经热点：联合早报、华尔街见闻、卫星通讯社
  "zaobao",
  "wallstreetcn-hot",
  "sputniknewscn",

  // 7、英文类（纯英文科技/资讯）：Hacker News、GitHub、Product Hunt
  "hackernews",
  "github-trending-today",
  "producthunt",
]

export const fixedColumnIds = ["focus", "hottest", "realtime", "updated"] as const satisfies Partial<ColumnID>[]
export const hiddenColumns = Object.keys(columns).filter(id => !fixedColumnIds.includes(id as any)) as HiddenColumnID[]

function getSortedSourceIds(type: "hottest" | "realtime") {
  return typeSafeObjectEntries(sources)
    .filter(([, v]) => v.type === type && !v.redirect)
    .map(([k]) => k)
    .sort((m, n) => m.localeCompare(n))
}

function getHottestSourceIds() {
  const otherHottest = getSortedSourceIds("hottest").filter(id => !defaultOrderedSources.includes(id))
  return [...defaultOrderedSources, ...otherHottest]
}

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k, v]) => {
  switch (k) {
    case "focus":
      return [k, {
        name: v.zh,
        sources: [...defaultOrderedSources],
      }]
    case "hottest":
      return [k, {
        name: v.zh,
        sources: getHottestSourceIds(),
      }]
    case "realtime":
      return [k, {
        name: v.zh,
        sources: getSortedSourceIds("realtime"),
      }]
    case "updated":
      return [k, {
        name: v.zh,
        sources: updatedSourceIds.filter(id => sources[id] && !sources[id].redirect),
      }]
    default:
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k),
      }]
  }
}))
