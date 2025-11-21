import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Production Subgraph Endpoint
// In production (Vercel), this comes from Environment Variables.
// In local dev, it falls back to the hosted service or local node.
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/demarket-dao/demarket-arbitrum';

export const graphClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

// --- PROFILES & REPUTATION ---

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      totalSales
      totalPurchases
      averageRating
      reviewCount
      joinedAt
      listings(where: { status: "Available" }) {
        id
        price
        status
        ipfsCid
      }
      reviewsReceived(orderBy: createdAt, orderDirection: desc, first: 10) {
        rating
        comment
        createdAt
        reviewer {
          id
          username
        }
      }
    }
  }
`;

// --- LISTINGS & SEARCH ---

export const SEARCH_LISTINGS = gql`
  query SearchListings($text: String!) {
    listings(
      where: { 
        status: "Available", 
        searchContent_contains: $text 
      }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      ipfsCid
      price
      currency
      createdAt
      seller {
        id
        averageRating
        reviewCount
      }
    }
  }
`;

// --- DAO ---

export const GET_PROPOSALS = gql`
  query GetProposals {
    proposals(orderBy: createdAt, orderDirection: desc) {
      id
      title
      status
      votesFor
      votesAgainst
      deadline
      proposer {
        id
        username
      }
    }
  }
`;

export const GET_PROPOSAL_DETAILS = gql`
  query GetProposalDetails($id: ID!) {
    proposal(id: $id) {
      id
      title
      descriptionIpfsCid
      status
      votesFor
      votesAgainst
      createdAt
      deadline
      votes(orderBy: weight, orderDirection: desc) {
        voter {
          id
          username
        }
        choice
        weight
      }
    }
  }
`;