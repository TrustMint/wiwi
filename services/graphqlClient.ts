
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// !!! ВСТАВЬТЕ СЮДА HTTP URL ВАШЕГО СУБГРАФА ИЗ THE GRAPH STUDIO !!!
const SUBGRAPH_URL = process.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_ID/demarket-sepolia/v0.0.1';

export const graphClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

export const GET_ACTIVE_LISTINGS = gql`
  query GetActiveListings {
    listings(where: { status: "Active" }, orderBy: createdAt, orderDirection: desc) {
      id
      price
      currency
      ipfsCid
      createdAt
      seller {
        id
        averageRating
        reputationTier
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      totalSales
      totalPurchases
      averageRating
      reviewCount
      reputationTier
      listings(where: { status: "Active" }) {
        id
        price
        currency
        ipfsCid
      }
    }
  }
`;
