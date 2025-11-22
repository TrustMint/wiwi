
import { Listing, User, ListingVariant } from '../types';
import { config } from '../hooks/useWallet';
import { ethers, Contract, Signer, BrowserProvider } from 'ethers';
import { graphClient, GET_ACTIVE_LISTINGS } from './graphqlClient';

// Minimal ABI for Marketplace interactions
const MARKETPLACE_ABI = [
  "function createListing(address _token, uint256 _price, uint256 _quantity, string calldata _ipfsCid) external",
  "function buy(uint256 _listingId, uint256 _quantity) external",
  "function confirmReceipt(uint256 _escrowId) external",
  "function openDispute(uint256 _escrowId, string calldata _reasonCid) external"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

class DeMarketService {
    private readonly API_UPLOAD_FILE_URL = '/api/upload'; 
    private readonly API_UPLOAD_JSON_URL = '/api/upload-json';

    // --- DATA FETCHING (READ) ---

    /**
     * Fetches active listings from Subgraph and hydrates them with IPFS metadata.
     */
    public async getListings(): Promise<Listing[]> {
        try {
            // 1. Get core data from Subgraph
            const { data } = await graphClient.query<any>({
                query: GET_ACTIVE_LISTINGS,
                fetchPolicy: 'network-only' // Always fetch fresh data
            });

            if (!data || !data.listings) return [];

            // 2. Hydrate with IPFS metadata (Parallel fetch)
            const hydratedListings = await Promise.all(
                data.listings.map(async (item: any) => {
                    try {
                        const metadata = await this.fetchIpfsMetadata(item.ipfsCid);
                        return this.mapSubgraphDataToListing(item, metadata);
                    } catch (err) {
                        console.warn(`Failed to hydrate listing ${item.id}`, err);
                        return null;
                    }
                })
            );

            return hydratedListings.filter((l): l is Listing => l !== null);
        } catch (error) {
            console.error("Failed to fetch listings from Subgraph:", error);
            return [];
        }
    }

    /**
     * Helper to fetch JSON from IPFS Gateway
     */
    private async fetchIpfsMetadata(cid: string): Promise<any> {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
        if (!response.ok) throw new Error('IPFS fetch failed');
        return await response.json();
    }

    /**
     * Maps Subgraph + IPFS data to our Listing type
     */
    private mapSubgraphDataToListing(subgraphItem: any, metadata: any): Listing {
        const props = metadata.properties || {};
        
        // Determine currency symbol based on address
        let currency: 'USDC' | 'USDT' = 'USDC';
        if (subgraphItem.token.toLowerCase() === config.TOKENS.USDT.toLowerCase()) currency = 'USDT';

        // Format price (assuming 6 decimals for USDC/USDT)
        const price = parseFloat(ethers.formatUnits(subgraphItem.price, 6));

        return {
            id: subgraphItem.id, // Contract Listing ID
            title: metadata.name || 'Без названия',
            description: metadata.description || '',
            price: price,
            currency: currency,
            images: props.images || [metadata.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || ''],
            category: props.category || 'Другое',
            condition: props.condition || 'Used',
            status: 'Available', // If it came from GET_ACTIVE_LISTINGS, it is available
            quantity: parseInt(subgraphItem.quantity),
            createdAt: new Date(parseInt(subgraphItem.createdAt) * 1000).toISOString(),
            location: props.location || 'Unknown',
            seller: {
                id: subgraphItem.seller.id,
                address: subgraphItem.seller.id,
                username: `${subgraphItem.seller.id.substring(0, 6)}...${subgraphItem.seller.id.substring(38)}`,
                avatar: `https://i.pravatar.cc/150?u=${subgraphItem.seller.id}`,
                rating: parseFloat(subgraphItem.seller.averageRating || '0'),
                reviews: parseInt(subgraphItem.seller.reviewCount || '0'),
                reputationTier: (subgraphItem.seller.reputationTier || 'none').toLowerCase(),
                // Defaults for fields not in this query
                memberSince: new Date().getFullYear(),
                dmtBalance: 0,
                stake: 0,
                lockedStake: 0,
                badges: [],
                createdAt: new Date().toISOString(),
                firstDealAt: new Date().toISOString(),
                goodReviewsCount: 0,
                badReviewsCount: 0,
                avgPaymentTime: 0,
                avgTransferTime: 0,
            },
            ipfsCid: subgraphItem.ipfsCid,
            // Hydrate optional fields from IPFS
            brand: props.brand,
            model: props.model,
            attributes: props.attributes,
            videoUrl: props.videoUrl,
            proofOfPurchaseCid: props.proofOfPurchaseCid,
            variants: props.variants
        };
    }

    public async getListingById(id: string): Promise<Listing | undefined> {
        // For Deep Linking. In prod, better to query Subgraph for specific ID.
        // Re-using getListings for MVP simplicity, filtering client-side.
        const all = await this.getListings();
        return all.find(l => l.id === id);
    }

    public async importListingFromIpfs(cid: string): Promise<Listing | null> {
        try {
            const metadata = await this.fetchIpfsMetadata(cid);
            // We don't have blockchain data (ID, seller, price) just from IPFS CID usually
            // returning a preview object
            return this.mapSubgraphDataToListing({
                id: 'preview',
                price: metadata.properties.price ? ethers.parseUnits(String(metadata.properties.price), 6).toString() : '0',
                token: config.TOKENS.USDC,
                quantity: '1',
                createdAt: Math.floor(Date.now() / 1000).toString(),
                seller: { id: metadata.properties.sellerAddress || '0x00' }
            }, metadata);
        } catch (e) {
            console.error("Import failed", e);
            return null;
        }
    }

    // --- BLOCKCHAIN INTERACTIONS (WRITE) ---

    public async createListingOnChain(
        listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'>,
        seller: User,
        imageFiles: File[],
        proofFile: File | undefined,
        videoFile: File | undefined,
        signer: Signer
    ): Promise<void> {
        
        // 1. Upload Assets to IPFS
        const uploadedImageUrls = await this.uploadFiles(imageFiles);
        const finalImages = [...listingData.images, ...uploadedImageUrls];
        
        let proofCid = listingData.proofOfPurchaseCid;
        if (proofFile) {
            const url = await this.uploadToBackendIpfs(proofFile);
            proofCid = url.split('/').pop(); // Extract CID
        }

        let videoUrl = listingData.videoUrl;
        if (videoFile) {
            videoUrl = await this.uploadToBackendIpfs(videoFile);
        }

        // 2. Create Metadata JSON
        const metadata = {
            name: listingData.title,
            description: listingData.description,
            image: finalImages[0],
            external_url: 'https://demarket.app',
            properties: {
                ...listingData,
                images: finalImages,
                videoUrl,
                proofOfPurchaseCid: proofCid,
                sellerAddress: seller.address,
                createdAt: new Date().toISOString()
            }
        };

        // 3. Upload Metadata to IPFS -> Get CID
        const ipfsCid = await this.uploadMetadataToIpfs(metadata);
        if (!ipfsCid) throw new Error("Failed to upload metadata");

        // 4. Send Transaction to Smart Contract
        const marketplace = new Contract(config.MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
        
        const tokenAddress = listingData.currency === 'USDT' ? config.TOKENS.USDT : config.TOKENS.USDC;
        // USDC/USDT have 6 decimals on Arbitrum
        const priceWei = ethers.parseUnits(listingData.price.toString(), 6);
        
        const tx = await marketplace.createListing(
            tokenAddress,
            priceWei,
            listingData.quantity,
            ipfsCid
        );

        await tx.wait(); // Wait for block confirmation
    }

    public async purchaseListingOnChain(listing: Listing, quantity: number, signer: Signer): Promise<void> {
        const marketplaceAddress = config.MARKETPLACE_ADDRESS;
        const tokenAddress = listing.currency === 'USDT' ? config.TOKENS.USDT : config.TOKENS.USDC;
        
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
        const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);

        // 1. Approve
        const totalPrice = listing.price * quantity;
        const priceWei = ethers.parseUnits(totalPrice.toFixed(6), 6); // 6 decimals
        
        const allowance = await tokenContract.allowance(await signer.getAddress(), marketplaceAddress);
        
        if (allowance < priceWei) {
            const approveTx = await tokenContract.approve(marketplaceAddress, priceWei);
            await approveTx.wait();
        }

        // 2. Buy
        const buyTx = await marketplace.buy(listing.id, quantity);
        await buyTx.wait();
    }

    public async confirmReceiptOnChain(listingId: string, signer: Signer): Promise<void> {
        // NOTE: In real app, we need the Escrow ID, not Listing ID. 
        // For this MVP, we assume we fetch the Escrow ID via Subgraph Purchase query.
        // Here we assume the UI passes the ESCROW ID as listingId, or we'd look it up.
        // FOR NOW: Assuming we passed the Escrow ID (Purchase ID from subgraph)
        const marketplace = new Contract(config.MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
        const tx = await marketplace.confirmReceipt(listingId);
        await tx.wait();
    }

    // --- IPFS UPLOAD HELPERS ---

    private async uploadFiles(files: File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const file of files) {
            urls.push(await this.uploadToBackendIpfs(file));
        }
        return urls;
    }

    public async uploadToBackendIpfs(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(this.API_UPLOAD_FILE_URL, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
    }

    public async uploadMetadataToIpfs(metadata: object): Promise<string | null> {
        const res = await fetch(this.API_UPLOAD_JSON_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.ipfsHash;
    }

    // --- LEGACY METHODS (Keeping empty to prevent UI crashes during migration) ---
    public subscribeToUpdates(cb: any) { return () => {}; }
    public syncListings(l: any) {}
    public getCurrentListings() { return []; }
    public async createListingStateless(...args: any[]) { return { newListing: null, updatedListings: [] }; }
    public async updateListingStateless(...args: any[]) { return { updatedListing: null, updatedListings: [] }; }
    public async toggleArchiveListing(...args: any[]) { return null; }
    public async updateListingStatus(...args: any[]) { return null; }
    public async purchaseListing(...args: any[]) { return null; }
    public async confirmReceipt(...args: any[]) { return null; }
}

export const demarketService = new DeMarketService();
