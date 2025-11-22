import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/1716048/demarket-sepolia/v0.0.1';

if (!import.meta.env.VITE_SUBGRAPH_URL) {
    console.warn("Warning: VITE_SUBGRAPH_URL is not defined. Using default fallback.");
}

export const graphClient = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL }),
  cache: new InMemoryCache(),
});

export const GET_ACTIVE_LISTINGS = gql`
  query GetActiveListings {
    listings(where: { status: "Active" }, orderBy: createdAt, orderDirection: desc) {
      id
      price
      token
      quantity
      ipfsCid
      createdAt
      seller {
        id
        averageRating
        reputationTier
        reviewCount
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
      listings(orderBy: createdAt, orderDirection: desc) {
        id
        price
        token
        status
        ipfsCid
        createdAt
      }
      purchases(orderBy: createdAt, orderDirection: desc) {
        id
        status
        amount
        listing {
          id
          ipfsCid
          seller {
            id
          }
        }
      }
    }
  }
`;