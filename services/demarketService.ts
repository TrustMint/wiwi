import { Listing, User } from '../types';
import { mockListings } from './mockData';

// This class simulates the interaction with a smart contract registry and IPFS.
// In a real application, this would be replaced with calls to ethers.js, web3.js, or an IPFS library.
class DeMarketService {
    private listings: Listing[] = [];
    private nextListingId: number;

    constructor() {
        // Initialize with mock data
        this.listings = [...mockListings];
        // Find the highest numeric ID from mocks to avoid collisions
        this.nextListingId = this.listings.reduce((maxId, listing) => {
            const numericId = parseInt(listing.id.replace('listing-', ''), 10);
            return numericId > maxId ? numericId : maxId;
        }, 0) + 1;
    }
    
    // Simulates fetching all listings from the smart contract registry
    public async getListings(): Promise<Listing[]> {
        console.log('[Service] Fetching all listings...');
        // In a real app, this would be a read call to the smart contract.
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async delay
        return [...this.listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public async getListingById(id: string): Promise<Listing | undefined> {
        console.log(`[Service] Fetching listing by ID: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async delay
        const foundListing = this.listings.find(listing => listing.id === id);
        if (!foundListing) {
            console.warn(`[Service] Listing with ID ${id} not found.`);
        }
        return foundListing;
    }

    // Simulates creating a new listing
    public async createListing(listingData: Omit<Listing, 'id' | 'seller' | 'status'>, seller: User): Promise<Listing> {
        console.log('[Service] Starting listing creation...');
        
        // 1. Simulate uploading content to IPFS
        const ipfsData = {
            title: listingData.title,
            description: listingData.description,
            images: listingData.images,
        };
        const ipfsCid = await this.simulateIpfsUpload(ipfsData);
        
        // 2. Simulate calling the smart contract to add to registry
        const newListing: Listing = {
            ...listingData,
            id: `listing-${this.nextListingId++}`,
            seller,
            status: 'Available',
            ipfsCid: ipfsCid,
            createdAt: new Date().toISOString(),
        };

        console.log(`[Contract Simulation] Writing listing ${newListing.id} to registry with CID: ${ipfsCid}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate transaction time

        this.listings.unshift(newListing);
        console.log('[Service] Listing created successfully.');
        return newListing;
    }

    // Simulates updating an existing listing
    public async updateListing(listingData: Omit<Listing, 'seller' | 'status' | 'buyer'> & { id: string }): Promise<Listing | null> {
        console.log(`[Service] Starting update for listing ${listingData.id}...`);
        
        const listingIndex = this.listings.findIndex(l => l.id === listingData.id);
        if (listingIndex === -1) {
            console.error("Listing not found for update");
            return null;
        }

        const originalListing = this.listings[listingIndex];
        
        // 1. Simulate re-uploading content to IPFS to get a new hash
        const ipfsData = {
            title: listingData.title,
            description: listingData.description,
            images: listingData.images,
        };
        const ipfsCid = await this.simulateIpfsUpload(ipfsData);

        // 2. Simulate updating the smart contract registry
        const updatedListing: Listing = {
            ...originalListing,
            ...listingData,
            ipfsCid: ipfsCid,
        };
        
        console.log(`[Contract Simulation] Updating listing ${updatedListing.id} in registry with new CID: ${ipfsCid}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate transaction time

        this.listings[listingIndex] = updatedListing;
        console.log('[Service] Listing updated successfully.');
        return updatedListing;
    }

    // --- Private Simulation Methods ---

    private async simulateIpfsUpload(data: any): Promise<string> {
        console.log('[IPFS Simulation] Uploading content...', data);
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate upload delay
        const hash = 'Qm' + Array(44).fill(0).map(() => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.random() * 62)).join('');
        console.log(`[IPFS Simulation] Content uploaded. CID: ${hash}`);
        return `ipfs://${hash}`;
    }
}

// Create a singleton instance of the service
export const demarketService = new DeMarketService();