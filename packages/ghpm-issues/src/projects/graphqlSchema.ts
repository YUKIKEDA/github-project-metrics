/**
 * GitHub Projects v2 の共通フィールド取得部分。
 * Organization / User それぞれのクエリで利用する。
 */
const PROJECT_V2_SELECTION = `
  # 指定した projectNumber の ProjectV2 ノード全体を取得する
  projectV2(number: $projectNumber) {
    # プロジェクトの一意識別子
    id
    # プロジェクトの番号（UI 表示にも利用される）
    number
    # プロジェクトのタイトル
    title
    # プロジェクトの短い説明文
    shortDescription
    # プロジェクトがクローズ済みかどうか
    closed
    # プロジェクトがクローズされた日時
    closedAt
    # プロジェクトが公開状態かどうか
    public
    # プロジェクトの作成日時
    createdAt
    # プロジェクトの最終更新日時
    updatedAt
    # プロジェクトの GitHub 上の URL
    url
    # プロジェクトの所有者情報
    owner {
      # 所有者の具体的な型（Organization / User など）
      __typename
      # 所有者が Organization の場合の情報
      ... on Organization {
        # 組織の一意識別子
        id
        # 組織のログイン名
        login
        # 組織の表示名
        name
        # 組織のプロフィール URL
        url
      }
      # 所有者が User の場合の情報
      ... on User {
        # ユーザーの一意識別子
        id
        # ユーザーのログイン名
        login
        # ユーザーの表示名
        name
        # ユーザーのプロフィール URL
        url
      }
    }
    # プロジェクトに定義されているカスタムフィールドの一覧
    fields(first: 50) {
      # 取得対象フィールドの総数
      totalCount
      # フィールドの詳細情報を格納するノード
      nodes {
        # フィールドの具体的な型
        __typename
        # フィールドの一意識別子
        id
        # フィールドの表示名
        name
        # フィールドのデータ型
        dataType
        # Single Select フィールドに固有の情報
        ... on ProjectV2SingleSelectField {
          # Single Select の選択肢一覧
          options {
            # 選択肢の一意識別子
            id
            # 選択肢の表示名
            name
            # 選択肢の説明文
            description
            # 選択肢の色
            color
          }
        }
        # Iteration フィールドに固有の情報
        ... on ProjectV2IterationField {
          # Iteration の設定値
          configuration {
            # 1 イテレーションの期間（日数）
            duration
            # 週の開始曜日（1=Monday）
            startDay
          }
          # 設定済みイテレーションの一覧
          iterations(first: $fieldIterationPageSize) {
            # イテレーションごとのノード
            nodes {
              # イテレーションの一意識別子
              id
              # イテレーションのタイトル
              title
              # イテレーションの開始日
              startDate
              # イテレーションの期間（日数）
              duration
            }
          }
        }
      }
      # フィールド一覧のページネーション情報
      pageInfo {
        # 次ページの有無
        hasNextPage
        # 次ページ取得時に利用するカーソル
        endCursor
      }
    }
    # プロジェクトに含まれるアイテムの一覧
    items(first: $itemsPageSize, after: $itemsCursor) {
      # アイテムの総数
      totalCount
      # アイテム一覧のページネーション情報
      pageInfo {
        # 次ページの有無
        hasNextPage
        # 次ページ取得時に利用するカーソル
        endCursor
      }
      # 各プロジェクトアイテムのノード
      nodes {
        # アイテムの一意識別子
        id
        # アイテムの種類（ISSUE / PULL_REQUEST など）
        type
        # アイテムの作成日時
        createdAt
        # アイテムの最終更新日時
        updatedAt
        # アイテムの実体コンテンツ
        content {
          # コンテンツの具体的な型
          __typename
          # DraftIssue の場合の情報
          ... on DraftIssue {
            # DraftIssue の一意識別子
            id
            # DraftIssue のタイトル
            title
            # DraftIssue の本文
            body
            # DraftIssue の作成日時
            createdAt
            # DraftIssue の最終更新日時
            updatedAt
          }
          # Issue の場合の情報
          ... on Issue {
            # Issue の一意識別子
            id
            # Issue の連番
            number
            # Issue のタイトル
            title
            # Issue の URL
            url
            # Issue のステータス（OPEN / CLOSED）
            state
            # Issue が所属するリポジトリ情報
            repository {
              # リポジトリの一意識別子
              id
              # リポジトリの owner/name 表記
              nameWithOwner
            }
            # Issue に割り当てられたユーザー
            assignees(first: $fieldUserPageSize) {
              # アサイン情報のノード
              nodes {
                # ユーザーの一意識別子
                id
                # ユーザーのログイン名
                login
                # ユーザーの表示名
                name
                # ユーザーのプロフィール URL
                url
                # ユーザーのアバター画像 URL
                avatarUrl
              }
            }
            # Issue に付与されているラベル
            labels(first: $fieldLabelPageSize) {
              # ラベル情報のノード
              nodes {
                # ラベルの一意識別子
                id
                # ラベル名
                name
                # ラベルカラー
                color
                # ラベルの説明
                description
              }
            }
          }
          # PullRequest の場合の情報
          ... on PullRequest {
            # PullRequest の一意識別子
            id
            # PullRequest の連番
            number
            # PullRequest のタイトル
            title
            # PullRequest の URL
            url
            # PullRequest のステータス（OPEN / MERGED / CLOSED）
            state
            # マージ済みかどうか
            merged
            # マージ日時
            mergedAt
            # PullRequest が属するリポジトリ情報
            repository {
              # リポジトリの一意識別子
              id
              # リポジトリの owner/name 表記
              nameWithOwner
            }
            # PullRequest の作成者情報
            author {
              # 作成者の具体的な型
              __typename
              # 作成者がユーザーの場合の情報
              ... on User {
                # ユーザーの一意識別子
                id
                # ユーザーのログイン名
                login
                # ユーザーの表示名
                name
                # ユーザーのプロフィール URL
                url
                # ユーザーのアバター画像 URL
                avatarUrl
              }
            }
          }
        }
        # アイテムに紐づくカスタムフィールド値
        fieldValues(first: $fieldValuesPageSize) {
          # フィールド値ごとのノード
          nodes {
            # フィールド値の具体的な型
            __typename
            # 対応するフィールドの基本情報
            field {
              # フィールドの一意識別子
              id
              # フィールドの名称
              name
            }
            # 日付フィールド値の場合
            ... on ProjectV2ItemFieldDateValue {
              # 設定されている日付
              date
            }
            # イテレーションフィールド値の場合
            ... on ProjectV2ItemFieldIterationValue {
              # 対応するイテレーションの ID
              iterationId
              # イテレーションのタイトル
              title
              # イテレーションの期間（日数）
              duration
              # イテレーションの開始日
              startDate
            }
            # ラベルフィールド値の場合
            ... on ProjectV2ItemFieldLabelValue {
              # ラベルをページング取得
              labels(first: $fieldLabelPageSize) {
                # ラベル情報のノード
                nodes {
                  # ラベルの一意識別子
                  id
                  # ラベル名
                  name
                  # ラベルカラー
                  color
                  # ラベルの説明
                  description
                }
              }
            }
            # マイルストーンフィールド値の場合
            ... on ProjectV2ItemFieldMilestoneValue {
              # 紐づくマイルストーンの情報
              milestone {
                # マイルストーンの一意識別子
                id
                # マイルストーンの連番
                number
                # マイルストーンのタイトル
                title
                # マイルストーンの URL
                url
                # マイルストーンの状態
                state
                # マイルストーンの期限
                dueOn
              }
            }
            # 数値フィールド値の場合
            ... on ProjectV2ItemFieldNumberValue {
              # 設定された数値
              number
            }
            # PullRequest フィールド値の場合
            ... on ProjectV2ItemFieldPullRequestValue {
              # 紐づく PullRequest の一覧
              pullRequests(first: 10) {
                # PullRequest 情報のノード
                nodes {
                  # PullRequest の一意識別子
                  id
                  # PullRequest の連番
                  number
                  # PullRequest のタイトル
                  title
                  # PullRequest の URL
                  url
                  # PullRequest のステータス
                  state
                }
              }
            }
            # リポジトリフィールド値の場合
            ... on ProjectV2ItemFieldRepositoryValue {
              # 紐づくリポジトリの一覧
              repositories(first: 10) {
                # リポジトリ情報のノード
                nodes {
                  # リポジトリの一意識別子
                  id
                  # リポジトリ名
                  name
                  # owner/name 形式の表記
                  nameWithOwner
                  # リポジトリの URL
                  url
                }
              }
            }
            # Single Select フィールド値の場合
            ... on ProjectV2ItemFieldSingleSelectValue {
              # 選択されたオプションの ID
              optionId
              # 選択されたオプション名
              name
            }
            # テキストフィールド値の場合
            ... on ProjectV2ItemFieldTextValue {
              # 設定されたテキスト
              text
            }
            # ユーザーフィールド値の場合
            ... on ProjectV2ItemFieldUserValue {
              # 紐づくユーザーの一覧
              users(first: $fieldUserPageSize) {
                # ユーザー情報のノード
                nodes {
                  # ユーザーの一意識別子
                  id
                  # ユーザーのログイン名
                  login
                  # ユーザーの表示名
                  name
                  # ユーザーのプロフィール URL
                  url
                  # ユーザーのアバター画像 URL
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * GitHub GraphQL API（Projects v2）で組織所有プロジェクトを取得するクエリ。
 */
export const ORGANIZATION_PROJECT_V2_GRAPHQL = /* GraphQL */ `
  # 組織所有のプロジェクトを取得するクエリ定義
  query OrganizationProjectV2Data(
    # 対象組織のログイン名（必須）
    $organization: String!
    # 対象プロジェクトの番号（必須）
    $projectNumber: Int!
    # アイテムを続きから取得するためのカーソル
    $itemsCursor: String
    # アイテム取得用のページサイズ（デフォルト 100）
    $itemsPageSize: Int = 100
    # フィールド値取得用のページサイズ（デフォルト 20）
    $fieldValuesPageSize: Int = 20
    # ラベル取得用のページサイズ（デフォルト 20）
    $fieldLabelPageSize: Int = 20
    # ユーザー取得用のページサイズ（デフォルト 20）
    $fieldUserPageSize: Int = 20
    # イテレーション取得用のページサイズ（デフォルト 20）
    $fieldIterationPageSize: Int = 20
  ) {
    # 組織情報とそのプロジェクトを取得
    organization(login: $organization) {
      # 共通フィールドセットを展開
      ${PROJECT_V2_SELECTION}
    }
  }
`;

/**
 * GitHub GraphQL API（Projects v2）でユーザー所有プロジェクトを取得するクエリ。
 */
export const USER_PROJECT_V2_GRAPHQL = /* GraphQL */ `
  # ユーザー所有のプロジェクトを取得するクエリ定義
  query UserProjectV2Data(
    # 対象ユーザーのログイン名（必須）
    $user: String!
    # 対象プロジェクトの番号（必須）
    $projectNumber: Int!
    # アイテムを続きから取得するためのカーソル
    $itemsCursor: String
    # アイテム取得用のページサイズ（デフォルト 100）
    $itemsPageSize: Int = 100
    # フィールド値取得用のページサイズ（デフォルト 20）
    $fieldValuesPageSize: Int = 20
    # ラベル取得用のページサイズ（デフォルト 20）
    $fieldLabelPageSize: Int = 20
    # ユーザー取得用のページサイズ（デフォルト 20）
    $fieldUserPageSize: Int = 20
    # イテレーション取得用のページサイズ（デフォルト 20）
    $fieldIterationPageSize: Int = 20
  ) {
    # ユーザー情報とそのプロジェクトを取得
    user(login: $user) {
      # 共通フィールドセットを展開
      ${PROJECT_V2_SELECTION}
    }
  }
`;

/**
 * `ORGANIZATION_PROJECT_V2_GRAPHQL` に渡す変数の型。
 */
export interface OrganizationProjectV2QueryVariables {
  /**
   * プロジェクトを所有する組織のログイン名。
   */
  organization: string;
  /**
   * 対象プロジェクトの番号。
   */
  projectNumber: number;
  /**
   * プロジェクトアイテムを続きから取得する際のカーソル。
   */
  itemsCursor?: string;
  /**
   * プロジェクトアイテム取得時のページサイズ（最大 100）。
   */
  itemsPageSize?: number;
  /**
   * フィールド値取得時のページサイズ（フィールドごと）。
   */
  fieldValuesPageSize?: number;
  /**
   * ラベル情報を取得する際のページサイズ。
   */
  fieldLabelPageSize?: number;
  /**
   * ユーザー情報を取得する際のページサイズ。
   */
  fieldUserPageSize?: number;
  /**
   * イテレーションフィールド設定を取得する際のページサイズ。
   */
  fieldIterationPageSize?: number;
}

/**
 * `USER_PROJECT_V2_GRAPHQL` に渡す変数の型。
 */
export interface UserProjectV2QueryVariables {
  /**
   * プロジェクトを所有するユーザーのログイン名。
   */
  user: string;
  /**
   * 対象プロジェクトの番号。
   */
  projectNumber: number;
  /**
   * プロジェクトアイテムを続きから取得する際のカーソル。
   */
  itemsCursor?: string;
  /**
   * プロジェクトアイテム取得時のページサイズ（最大 100）。
   */
  itemsPageSize?: number;
  /**
   * フィールド値取得時のページサイズ（フィールドごと）。
   */
  fieldValuesPageSize?: number;
  /**
   * ラベル情報を取得する際のページサイズ。
   */
  fieldLabelPageSize?: number;
  /**
   * ユーザー情報を取得する際のページサイズ。
   */
  fieldUserPageSize?: number;
  /**
   * イテレーションフィールド設定を取得する際のページサイズ。
   */
  fieldIterationPageSize?: number;
}
