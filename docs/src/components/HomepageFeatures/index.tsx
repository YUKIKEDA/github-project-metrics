import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "プロジェクトヘルスを即時に把握",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        リポジトリのコミットや Issue
        の推移をダッシュボードでひと目で確認。活動量の変化を
        すばやく察知し、意思決定につなげられます。
      </>
    ),
  },
  {
    title: "データドリブンな改善サイクル",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        月次の開発スループットや Issue
        内訳、使用言語の構成を可視化。チームのボトルネックを
        洗い出し、改善活動を継続的に回せます。
      </>
    ),
  },
  {
    title: "柔軟な拡張性",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        JSON
        データを差し替えるだけでグラフを更新でき、必要な指標を素早く試せます。
        開発が進んだら GitHub API
        や任意のバックエンド連携へ置き換えて拡張可能です。
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
