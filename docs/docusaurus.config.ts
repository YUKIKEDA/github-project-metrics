import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'GitHub Project Metrics',
  tagline: 'GitHubリポジトリの活動量を可視化し、チームの状況把握をスピーディーに',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  //--------------------------------------------------

  // Set the production url of your site here
  url: 'https://yukikeda.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/github-project-metrics/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'YUKIKEDA', // Usually your GitHub org/user name.
  projectName: 'github-project-metrics', // Usually your repo name.

  //--------------------------------------------------

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/YUKIKEDA/github-project-metrics/tree/main/docs/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/YUKIKEDA/github-project-metrics/tree/main/docs/blog/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GitHub Project Metrics',
      logo: {
        alt: 'GitHub Project Metrics Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'ドキュメント',
        },
        {to: '/blog', label: 'ブログ', position: 'left'},
        {
          href: 'https://github.com/YUKIKEDA/github-project-metrics',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'リソース',
          items: [
            {
              label: 'ドキュメント',
              to: '/docs/intro',
            },
            {
              label: 'ブログ',
              to: '/blog',
            },
          ],
        },
        {
          title: 'コントリビューション',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/YUKIKEDA/github-project-metrics/issues',
            },
            {
              label: 'GitHub Repository',
              href: 'https://github.com/YUKIKEDA/github-project-metrics',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} YUKIKEDA. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
