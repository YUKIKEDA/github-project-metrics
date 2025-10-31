//@ts-check
/// <reference path="./types.d.ts" />

// 共通のGraphQLフラグメント
export const ISSUE_FRAGMENT = `
  ... on Issue {
    id
    number
    title
    state
    createdAt
    updatedAt
    closedAt
    url
    assignees(first: 10) {
      nodes {
        id
        login
      }
    }
    labels(first: 10) {
      nodes {
        id
        name
        color
      }
    }
  }
`;

export const PULL_REQUEST_FRAGMENT = `
  ... on PullRequest {
    id
    number
    title
    state
    createdAt
    updatedAt
    closedAt
    url
    isDraft
    assignees(first: 10) {
      nodes {
        id
        login
      }
    }
    labels(first: 10) {
      nodes {
        id
        name
        color
      }
    }
  }
`;

export const DRAFT_ISSUE_FRAGMENT = `
  ... on DraftIssue {
    id
    title
    body
    createdAt
    updatedAt
  }
`;

export const FIELD_VALUE_FRAGMENT = `
  ... on ProjectV2ItemFieldSingleSelectValue {
    field {
      ... on ProjectV2SingleSelectField {
        id
        name
      }
    }
    name
  }
  ... on ProjectV2ItemFieldTextValue {
    field {
      ... on ProjectV2Field {
        id
        name
      }
    }
    text
  }
  ... on ProjectV2ItemFieldNumberValue {
    field {
      ... on ProjectV2Field {
        id
        name
      }
    }
    number
  }
  ... on ProjectV2ItemFieldDateValue {
    field {
      ... on ProjectV2Field {
        id
        name
      }
    }
    date
  }
`;

export const ITEM_FRAGMENT = `
  id
  type
  content {
    ${ISSUE_FRAGMENT}
    ${PULL_REQUEST_FRAGMENT}
    ${DRAFT_ISSUE_FRAGMENT}
  }
  fieldValues(first: 20) {
    nodes {
      ${FIELD_VALUE_FRAGMENT}
    }
  }
`;

export const PROJECT_ITEMS_FRAGMENT = `
  items(first: 100) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      ${ITEM_FRAGMENT}
    }
  }
`;

export const PROJECT_FRAGMENT = `
  id
  title
  number
  url
  createdAt
  updatedAt
  closedAt
  shortDescription
  ${PROJECT_ITEMS_FRAGMENT}
`;

export const PROJECTS_FRAGMENT = `
  totalCount
  pageInfo {
    hasNextPage
    endCursor
  }
  nodes {
    ${PROJECT_FRAGMENT}
  }
`;

