
import { Listing, User } from '../types';
import { mockListings } from './mockData';

// This class simulates the interaction with a smart contract registry and IPFS via a Backend Proxy.
class DeMarketService {
    private listings: Listing[] = [];
    private nextListingId: number;
    private updateCallbacks: ((listings: Listing[]) => void)[] = [];
    
    // Production endpoints
    private readonly API_UPLOAD_FILE_URL = '/api/upload'; 
    private readonly API_UPLOAD_JSON_URL = '/api/upload-json';

    constructor() {
        // Initialize with mock data
        this.listings = [...mockListings];
        // Find the highest numeric ID from mocks to avoid collisions
        this.nextListingId = this.listings.reduce((maxId, listing) => {
            const numericId = parseInt(listing.id.replace('listing-', ''), 10);
            return !isNaN(numericId) && numericId > maxId ? numericId : maxId;
        }, 0) + 1;
    }
    
    public subscribeToUpdates(callback: (listings: Listing[]) => void): () => void {
        this.updateCallbacks.push(callback);
        return () => {
            this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifySubscribers(): void {
        const currentListings = [...this.listings];
        this.updateCallbacks.forEach(callback => {
            try {
                callback(currentListings);
            } catch (error) {
                console.error('[Service] Error in update callback:', error);
            }
        });
    }

    public async getListings(): Promise<Listing[]> {
        // In a real app, fetch from blockchain or indexer here
        await new Promise(resolve => setTimeout(resolve, 100));
        return [...this.listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public async getListingById(id: string): Promise<Listing | undefined> {
        await new Promise(resolve => setTimeout(resolve, 50));
        const foundListing = this.listings.find(listing => listing.id === id);
        return foundListing;
    }

    /**
     * IMPORT LISTING FROM IPFS (For Deep Linking)
     */
    public async importListingFromIpfs(cid: string): Promise<Listing | null> {
        console.log(`[Service] Importing listing from IPFS CID: ${cid}`);
        
        // Check if we already have this listing in memory to avoid duplicates
        const existing = this.listings.find(l => l.ipfsCid === cid);
        if (existing) return existing;

        try {
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            
            const metadata = await response.json();
            const props = metadata.properties || {};
            
            // FIX: Properly format username if address exists
            const address = props.sellerAddress;
            const username = address 
                ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` 
                : 'Неизвестный продавец';

            // Reconstruct Listing object from NFT Metadata
            // Note: In a real app, the ID would come from the blockchain. 
            // Here we generate a temporary ID for viewing.
            const importedListing: Listing = {
                id: `ipfs-${cid.substring(0, 6)}`,
                title: metadata.name || 'Untitled',
                description: metadata.description || '',
                images: props.images || [metadata.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || ''],
                price: props.price || 0,
                currency: props.currency || 'USDC',
                category: props.category || 'Other',
                condition: props.condition || 'Used',
                status: 'Available',
                seller: {
                    // Create a placeholder seller since we don't have the full user DB connected yet
                    id: 'seller-imported',
                    username: username,
                    address: address || '0x0000000000000000000000000000000000000000',
                    avatar: `https://i.pravatar.cc/150?u=${address || 'unknown'}`,
                    rating: 0,
                    reviews: 0,
                    memberSince: new Date().getFullYear(),
                    dmtBalance: 0,
                    stake: 0,
                    lockedStake: 0,
                    badges: [],
                    reputationTier: 'none',
                    createdAt: new Date().toISOString(),
                    firstDealAt: new Date().toISOString(),
                    goodReviewsCount: 0,
                    badReviewsCount: 0,
                    avgPaymentTime: 0,
                    avgTransferTime: 0,
                },
                location: props.location || 'Global',
                createdAt: props.createdAt || new Date().toISOString(),
                quantity: props.quantity || 1,
                ipfsCid: cid,
                brand: props.brand,
                model: props.model,
                // Ensure we map attributes and proof correctly from properties
                attributes: props.attributes, 
                proofOfPurchaseCid: props.proofOfPurchaseCid,
                videoUrl: props.videoUrl,
                serviceDetails: props.serviceDetails,
                isNegotiable: props.isNegotiable,
                variants: props.variants // Import variants if present
            };

            // If attributes weren't in properties, try to parse standard NFT attributes (Legacy fallback)
            if (!importedListing.attributes && metadata.attributes) {
                const attrs: Record<string, string | number> = {};
                metadata.attributes.forEach((attr: any) => {
                    if (!['Category', 'Condition', 'Price', 'Currency', 'Brand', 'Model'].includes(attr.trait_type)) {
                        attrs[attr.trait_type] = attr.value;
                    }
                });
                importedListing.attributes = attrs;
            }

            // Add to local store so it appears in the app
            this.listings.unshift(importedListing);
            this.notifySubscribers();

            return importedListing;

        } catch (error) {
            console.error('Failed to import listing from IPFS:', error);
            return null;
        }
    }

    /**
     * UPLOAD FILE TO IPFS
     */
    public async uploadToBackendIpfs(file: File): Promise<string> {
        console.groupCollapsed(`[IPFS] Uploading File: ${file.name}`);
        
        try {
            const formData = new FormData();
            formData.append('file', file);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for larger files

            const response = await fetch(this.API_UPLOAD_FILE_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.ipfsHash) { // Changed from ipfsUrl to ensure we get the CID if needed
                    const url = `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
                    console.log('✅ Success:', url);
                    console.groupEnd();
                    return url; // Return full URL by default, or Hash if needed
                }
                if (data.ipfsUrl) {
                     console.log('✅ Success:', data.ipfsUrl);
                     console.groupEnd();
                     return data.ipfsUrl;
                }
            }
            console.warn('Upload response not OK:', response.status, response.statusText);
        } catch (error) {
            console.warn('⚠️ Upload failed/skipped (Simulation Mode or Network Error)', error);
        }

        // Fallback Simulation - Essential for "Creation" to work even without backend
        const blobUrl = URL.createObjectURL(file);
        console.log('🔸 Using Blob URL (Fallback):', blobUrl);
        console.groupEnd();
        return blobUrl; 
    }

    /**
     * UPLOAD METADATA JSON TO IPFS
     */
    public async uploadMetadataToIpfs(metadata: object): Promise<string | null> {
        console.groupCollapsed(`[IPFS] Uploading Metadata JSON`);
        console.log(metadata);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(this.API_UPLOAD_JSON_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.ipfsHash) {
                    console.log('✅ Metadata Uploaded! CID:', data.ipfsHash);
                    console.log('🔗 Public Link:', data.ipfsUrl);
                    console.groupEnd();
                    return data.ipfsHash;
                }
            }
             console.warn('Metadata upload response not OK:', response.status);
        } catch (error) {
            console.warn('⚠️ Metadata upload failed/skipped (Simulation Mode)', error);
        }
        
        console.log('🔸 Metadata upload skipped in simulation');
        console.groupEnd();
        return null;
    }

    public async createListingStateless(
        listingData: Omit<Listing, 'id' | 'seller' | 'status'>, 
        seller: User,
        currentListings: Listing[],
        imageFiles: File[] = [],
        proofFile?: File,
        videoFile?: File
    ): Promise<{ newListing: Listing; updatedListings: Listing[] }> {
        console.log('[Service] Starting listing creation process...');
        
        // 1. Upload Images (Parallel)
        const uploadedImageUrls: string[] = [];
        if (imageFiles.length > 0) {
             // Upload images sequentially to avoid overwhelming the serverless function/rate limits
             for (const file of imageFiles) {
                 const url = await this.uploadToBackendIpfs(file);
                 uploadedImageUrls.push(url);
             }
        }
        // Combine existing URLs (if any) with new uploads
        const finalImages = [...listingData.images, ...uploadedImageUrls];

        // 2. Upload Proof
        let proofCid = listingData.proofOfPurchaseCid;
        if (proofFile) {
            const proofUrl = await this.uploadToBackendIpfs(proofFile);
            const match = proofUrl.match(/ipfs\/([a-zA-Z0-9]+)/);
            proofCid = match ? match[1] : proofUrl;
        }

        // 3. Upload Video
        let finalVideoUrl = listingData.videoUrl;
        if (videoFile) {
            finalVideoUrl = await this.uploadToBackendIpfs(videoFile);
        }
        
        // 4. Create Metadata Object (Standard NFT / OpenSea format + Custom props)
        const metadata = {
            name: listingData.title,
            description: listingData.description,
            image: finalImages[0] || '', // Primary image
            external_url: typeof window !== 'undefined' ? window.location.origin : 'https://demarket.app',
            attributes: [
                { trait_type: "Category", value: listingData.category },
                { trait_type: "Condition", value: listingData.condition },
                { trait_type: "Price", value: listingData.price },
                { trait_type: "Currency", value: listingData.currency },
                ...(listingData.brand ? [{ trait_type: "Brand", value: listingData.brand }] : []),
                ...(listingData.model ? [{ trait_type: "Model", value: listingData.model }] : []),
                // Flatten custom attributes into metadata for OpenSea compatibility
                ...(listingData.attributes ? Object.entries(listingData.attributes).map(([k, v]) => ({
                    trait_type: k,
                    value: v
                })) : [])
            ],
            properties: {
                ...listingData,
                // EXPLICITLY ADDING PROOF, ATTRIBUTES, AND VARIANTS HERE TO ENSURE THEY ARE SAVED
                proofOfPurchaseCid: proofCid, 
                attributes: listingData.attributes,
                variants: listingData.variants, // <--- ADD VARIANTS TO METADATA
                images: finalImages,
                videoUrl: finalVideoUrl,
                sellerAddress: seller.address,
                createdAt: new Date().toISOString()
            }
        };

        // 5. Upload Metadata to IPFS
        // This gives us the final "Token URI" that would go onto the blockchain
        const metadataCid = await this.uploadMetadataToIpfs(metadata);

        // 6. Create Local State Object (Optimistic Update)
        // IMPORTANT: Ensure seller matches exactly what the app expects (references)
        const newListing: Listing = {
            ...listingData,
            id: `listing-${this.nextListingId++}`,
            seller,
            status: 'Available',
            images: finalImages,
            videoUrl: finalVideoUrl,
            proofOfPurchaseCid: proofCid,
            ipfsCid: metadataCid || undefined, // Store the Metadata CID reference
            createdAt: new Date().toISOString(),
        };

        // Add to the BEGINNING of the array
        const updatedListings = [newListing, ...currentListings];
        
        // CRITICAL: Update the singleton instance state immediately
        this.listings = updatedListings;
        this.notifySubscribers();
        
        console.log('[Service] Listing created locally:', newListing);
        
        return { newListing, updatedListings };
    }

    public async updateListingStateless(
        listingData: Omit<Listing, 'seller' | 'status' | 'buyer'> & { id: string; proofOfPurchaseCid?: string },
        currentListings: Listing[],
        newImageFiles: File[] = [],
        newProofFile?: File,
        newVideoFile?: File
    ): Promise<{ updatedListing: Listing | null; updatedListings: Listing[] }> {
        console.log(`[Service] Updating listing ${listingData.id}...`);
        
        const listingIndex = currentListings.findIndex(l => l.id === listingData.id);
        if (listingIndex === -1) return { updatedListing: null, updatedListings: currentListings };
        const originalListing = currentListings[listingIndex];

        // 1. Upload New Images
        const newUploadedUrls: string[] = [];
        if (newImageFiles.length > 0) {
             for (const file of newImageFiles) {
                 const url = await this.uploadToBackendIpfs(file);
                 newUploadedUrls.push(url);
             }
        }
        const finalImages = [...listingData.images, ...newUploadedUrls];
        
        // 2. Upload New Proof or Keep Old
        let proofCid: string | undefined;
        if (newProofFile) {
             const proofUrl = await this.uploadToBackendIpfs(newProofFile);
             const match = proofUrl.match(/ipfs\/([a-zA-Z0-9]+)/);
             proofCid = match ? match[1] : proofUrl;
        } else {
            proofCid = listingData.proofOfPurchaseCid || originalListing.proofOfPurchaseCid;
        }

        // 3. Upload New Video or Keep Old
        let finalVideoUrl = listingData.videoUrl;
        if (newVideoFile) {
            finalVideoUrl = await this.uploadToBackendIpfs(newVideoFile);
        }

        // 4. Upload Updated Metadata
        const metadata = {
            name: listingData.title,
            description: listingData.description,
            image: finalImages[0] || '',
            external_url: typeof window !== 'undefined' ? window.location.origin : 'https://demarket.app',
            properties: {
                ...listingData,
                proofOfPurchaseCid: proofCid, 
                attributes: listingData.attributes,
                variants: listingData.variants, // Include variants
                images: finalImages,
                videoUrl: finalVideoUrl,
                updatedAt: new Date().toISOString()
            }
        };
        const metadataCid = await this.uploadMetadataToIpfs(metadata);

        // 5. Update Local Object
        const updatedListing: Listing = {
            ...originalListing,
            ...listingData,
            images: finalImages,
            videoUrl: finalVideoUrl,
            proofOfPurchaseCid: proofCid,
            ipfsCid: metadataCid || originalListing.ipfsCid,
        };
        
        const updatedListings = [...currentListings];
        updatedListings[listingIndex] = updatedListing;
        this.listings = updatedListings;
        this.notifySubscribers();
        
        return { updatedListing, updatedListings };
    }

    public async updateListingStatus(listingId: string, status: Listing['status'], buyer?: User): Promise<Listing | null> {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) return null;

        const updatedListing: Listing = {
            ...this.listings[listingIndex],
            status,
            ...(buyer && { buyer }),
            ...(status === 'Sold' && { quantity: 0 }),
        };

        this.listings[listingIndex] = updatedListing;
        this.notifySubscribers();
        return updatedListing;
    }

    public async confirmReceipt(listingId: string): Promise<Listing | null> {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) return null;

        const updatedListing: Listing = {
            ...this.listings[listingIndex],
            status: 'Sold',
        };
        this.listings[listingIndex] = updatedListing;
        this.notifySubscribers();
        return updatedListing;
    }

    public async purchaseListing(listingId: string, buyer: User, quantity: number = 1): Promise<Listing | null> {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) return null;

        const currentListing = this.listings[listingIndex];
        
        // Logic for variant purchasing would go here if the backend supported specific SKU tracking.
        // For now, we reduce the global quantity or the specific variant's quantity if logic allows.
        // Note: To support variant purchasing, we'd likely need to pass the variant ID here.
        // Since this signature is generic, we assume quantity check is done.

        // In a real implementation, we would find the specific variant inside 'currentListing.variants' and decrement it.
        // However, for this mock service, we'll just decrement the global 'quantity' field which represents total stock.
        
        if (currentListing.quantity < quantity) return null;

        const updatedListing: Listing = {
            ...currentListing,
            quantity: currentListing.quantity - quantity,
            status: 'In Escrow',
            buyer: buyer,
        };
        
        // Note: We don't strictly update specific variant quantities in this mock function
        // because the 'variants' array inside the listing is complex to mutate without a variant ID.
        // In a real backend, this would be handled by the smart contract or DB.

        this.listings[listingIndex] = updatedListing;
        this.notifySubscribers();
        return updatedListing;
    }

    public async toggleArchiveListing(listingId: string, archive: boolean): Promise<Listing | null> {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) return null;

        const updatedListing: Listing = {
            ...this.listings[listingIndex],
            status: archive ? 'Archived' : 'Available',
        };
        this.listings[listingIndex] = updatedListing;
        this.notifySubscribers();
        return updatedListing;
    }

    public syncListings(updatedListings: Listing[]): void {
        this.listings = [...updatedListings];
        this.notifySubscribers();
    }
    
    public getCurrentListings(): Listing[] {
        return [...this.listings];
    }
}

export const demarketService = new DeMarketService();
