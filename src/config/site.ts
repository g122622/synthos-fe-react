export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Synthos WebUI",
  description: "QQ聊天记录全链路总结功能",
  navItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "聊天记录",
      href: "/chat-messages",
    },
    {
      label: "摘要结果",
      href: "/ai-digest",
    },
    {
      label: "群组管理",
      href: "/groups",
    },
  ],
  navMenuItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "聊天记录",
      href: "/chat-messages",
    },
    {
      label: "摘要结果",
      href: "/ai-digest",
    },
    {
      label: "群组管理",
      href: "/groups",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
