
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// Helper to safely access environment variables
const getEnv = (key: string, defaultValue: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Ignore
  }

  return defaultValue;
};

// UPDATED: Using the new deployed subgraph URL provided by the user
const SUBGRAPH_URL = getEnv('VITE_SUBGRAPH_URL', 'https://api.studio.thegraph.com/query/1716048/demarket/v0.0.1');

if (!SUBGRAPH_URL) {
    console.warn("Warning: VITE_SUBGRAPH_URL is not defined. Database features will fail.");
}

export const graphClient = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL }),
  cache: new InMemoryCache(),
});

// Changed to fetch ALL listings to populate history, filtering will happen on client or specific queries
export const GET_ALL_LISTINGS = gql`
  query GetAllListings {
    listings(orderBy: createdAt, orderDirection: desc, first: 1000) {
      id
      price
      token
      quantity
      ipfsCid
      status
      createdAt
      seller {
        id
        averageRating
        reputationTier
        reviewCount
        goodReviewsCount
        badReviewsCount
        avgPaymentTime
        avgTransferTime
        createdAt
        firstDealAt
      }
      buyer {
        id
      }
    }
  }
`;

export const GET_ALL_REVIEWS = gql`
  query GetAllReviews {
    reviews(orderBy: createdAt, orderDirection: desc, first: 1000) {
      id
      rating
      commentCid
      createdAt
      reviewer {
        id
      }
      reviewedUser {
        id
      }
      purchase {
        listing {
          id
        }
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
