
import { Listing, User, Review } from '../types';
import { config } from '../hooks/useWallet';
import { ethers, Contract, Signer } from 'ethers';
import { graphClient, GET_ALL_LISTINGS, GET_ALL_REVIEWS } from './graphqlClient';

// Extended ABI including cancelTrade
const MARKETPLACE_ABI = [
  "function createListing(address _token, uint256 _price, uint256 _quantity, string calldata _ipfsCid) external returns (uint256)",
  "function buy(uint256 _listingId, uint256 _quantity) external",
  "function confirmReceipt(uint256 _escrowId) external",
  "function cancelTrade(uint256 _listingId) external", 
  "function openDispute(uint256 _escrowId, string calldata _reasonCid) external",
  "function getListing(uint256 _listingId) external view returns (address, uint256, uint256, string memory, bool)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, address token, uint256 price, uint256 quantity, string ipfsCid)",
  "event PurchaseCreated(uint256 indexed escrowId, uint256 indexed listingId, address buyer, uint256 quantity)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

class DeMarketService {
    // --- DATA FETCHING (READ) ---

    public async getListings(): Promise<Listing[]> {
        try {
            console.log("🔄 Загрузка объявлений из Subgraph...");
            
            const { data, error } = await graphClient.query<any>({
                query: GET_ALL_LISTINGS,
                fetchPolicy: 'network-only'
            });

            if (error) {
                console.error("❌ Ошибка GraphQL:", error);
                throw new Error(`Ошибка загрузки данных: ${error.message}`);
            }

            if (!data || !data.listings) {
                console.warn("⚠️ Нет данных в ответе Subgraph");
                return [];
            }

            console.log(`📥 Получено ${data.listings.length} объявлений из Subgraph`);

            // Параллельная загрузка метаданных с ограничением
            const batchSize = 5;
            const hydratedListings: Listing[] = [];
            
            for (let i = 0; i < data.listings.length; i += batchSize) {
                const batch = data.listings.slice(i, i + batchSize);
                const batchPromises = batch.map(async (item: any) => {
                    try {
                        const metadata = await this.fetchIpfsMetadata(item.ipfsCid);
                        return this.mapSubgraphDataToListing(item, metadata);
                    } catch (err) {
                        console.warn(`⚠️ Не удалось загрузить метаданные для ${item.id} (${item.ipfsCid}):`, err);
                        return this.createFallbackListing(item);
                    }
                });

                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        hydratedListings.push(result.value);
                    }
                });
            }

            console.log(`✅ Успешно загружено ${hydratedListings.length} объявлений`);
            return hydratedListings;

        } catch (error) {
            console.error("❌ Критическая ошибка при загрузке объявлений:", error);
            return [];
        }
    }

    public async getReviews(): Promise<Review[]> {
        try {
            console.log("🔄 Загрузка отзывов из Subgraph...");
            const { data, error } = await graphClient.query<any>({
                query: GET_ALL_REVIEWS,
                fetchPolicy: 'network-only'
            });

            if (error) throw new Error(error.message);
            if (!data || !data.reviews) return [];

            // Parallel fetch for review comments from IPFS
            const reviews: Review[] = await Promise.all(data.reviews.map(async (r: any) => {
                let comment = "Нет комментария";
                if (r.commentCid) {
                    try {
                        // Attempt to fetch comment text if CID exists
                        const metadata = await this.fetchIpfsMetadata(r.commentCid);
                        comment = metadata.comment || metadata.text || "Комментарий недоступен";
                    } catch {
                        // Fallback if IPFS fail or it's just a text string stored as CID (legacy)
                        comment = r.commentCid.length < 46 ? r.commentCid : "Загрузка комментария...";
                    }
                }

                return {
                    id: r.id,
                    listingId: r.purchase?.listing?.id || "unknown",
                    rating: parseInt(r.rating),
                    comment: comment,
                    createdAt: new Date(parseInt(r.createdAt) * 1000).toISOString(),
                    buyerUsername: this.formatAddress(r.reviewer.id), // Fallback name
                    buyerAvatar: r.reviewer.id, // Use address as seed
                };
            }));

            return reviews;
        } catch (e) {
            console.error("Failed to fetch reviews", e);
            return [];
        }
    }

    private createFallbackListing(subgraphItem: any): Listing {
        const currency = subgraphItem.token.toLowerCase() === config.TOKENS.USDT.toLowerCase() ? 'USDT' : 'USDC';
        const price = parseFloat(ethers.formatUnits(subgraphItem.price, 6));

        return {
            id: subgraphItem.id,
            title: 'Загрузка...',
            description: 'Метаданные недоступны',
            price: price,
            currency: currency,
            images: [],
            category: 'Другое',
            condition: 'Used',
            status: this.mapStatus(subgraphItem.status),
            quantity: parseInt(subgraphItem.quantity || '1'),
            createdAt: new Date(parseInt(subgraphItem.createdAt) * 1000).toISOString(),
            location: 'Unknown',
            seller: {
                id: subgraphItem.seller.id,
                address: subgraphItem.seller.id,
                username: this.formatAddress(subgraphItem.seller.id),
                avatar: subgraphItem.seller.id, // Ensure we pass address as seed
                rating: 0,
                reviews: 0,
                reputationTier: 'none',
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
            ipfsCid: subgraphItem.ipfsCid
        };
    }

    private formatAddress(address: string): string {
        if(!address) return "Unknown";
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    private async fetchIpfsMetadata(cid: string): Promise<any> {
        if (!cid || cid === 'undefined' || cid.startsWith('local-')) {
            if(cid.startsWith('local-')) {
                 const localData = localStorage.getItem(`metadata-${cid}`);
                 if (localData) return JSON.parse(localData);
            }
            throw new Error('Неверный или локальный CID');
        }

        const gateways = [
            `https://gateway.pinata.cloud/ipfs/${cid}`,
            `https://ipfs.io/ipfs/${cid}`,
            `https://cloudflare-ipfs.com/ipfs/${cid}`
        ];

        for (const gateway of gateways) {
            try {
                const response = await fetch(gateway, { 
                    signal: AbortSignal.timeout(5000) 
                });
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                continue;
            }
        }

        throw new Error('Не удалось загрузить метаданные со всех гейтвеев');
    }

    private mapStatus(subgraphStatus: string): 'Available' | 'In Escrow' | 'Sold' | 'Archived' {
        if (subgraphStatus === 'Active') return 'Available';
        if (subgraphStatus === 'InEscrow') return 'In Escrow';
        if (subgraphStatus === 'Sold') return 'Sold';
        if (subgraphStatus === 'Cancelled') return 'Archived';
        return 'Available';
    }

    private mapSubgraphDataToListing(subgraphItem: any, metadata: any): Listing {
        const props = metadata.properties || {};
        
        const currency: 'USDC' | 'USDT' = subgraphItem.token.toLowerCase() === config.TOKENS.USDT.toLowerCase() ? 'USDT' : 'USDC';
        const price = parseFloat(ethers.formatUnits(subgraphItem.price, 6));

        const images = this.processImages(props.images || []);
        if (metadata.image && !images.includes(metadata.image)) {
            images.unshift(this.processIpfsUrl(metadata.image));
        }

        const listing: Listing = {
            id: subgraphItem.id,
            title: metadata.name || 'Без названия',
            description: metadata.description || 'Нет описания',
            price: price,
            currency: currency,
            images: images,
            category: props.category || 'Другое',
            condition: props.condition || 'Used',
            status: this.mapStatus(subgraphItem.status),
            quantity: parseInt(subgraphItem.quantity || '1'),
            createdAt: new Date(parseInt(subgraphItem.createdAt) * 1000).toISOString(),
            location: props.location || 'Не указан',
            seller: {
                id: subgraphItem.seller.id,
                address: subgraphItem.seller.id,
                username: props.sellerUsername || this.formatAddress(subgraphItem.seller.id),
                // Use address as seed for avatar consistency, ignore IPFS URL unless it's a custom image
                avatar: subgraphItem.seller.id, 
                rating: parseFloat(subgraphItem.seller.averageRating || '0'),
                reviews: parseInt(subgraphItem.seller.reviewCount || '0'),
                reputationTier: (subgraphItem.seller.reputationTier || 'none').toLowerCase(),
                memberSince: props.memberSince || new Date().getFullYear(),
                dmtBalance: 0,
                stake: 0,
                lockedStake: 0,
                badges: props.badges || [],
                createdAt: props.createdAt || new Date().toISOString(),
                firstDealAt: props.firstDealAt || new Date().toISOString(),
                goodReviewsCount: parseInt(subgraphItem.seller.goodReviewsCount || '0'),
                badReviewsCount: parseInt(subgraphItem.seller.badReviewsCount || '0'),
                avgPaymentTime: parseFloat(subgraphItem.seller.avgPaymentTime || '0'),
                avgTransferTime: parseFloat(subgraphItem.seller.avgTransferTime || '0'),
            },
            ipfsCid: subgraphItem.ipfsCid,
            brand: props.brand,
            model: props.model,
            attributes: props.attributes,
            videoUrl: props.videoUrl,
            proofOfPurchaseCid: props.proofOfPurchaseCid,
            variants: props.variants
        };

        if (subgraphItem.buyer) {
            listing.buyer = {
                id: subgraphItem.buyer.id,
                address: subgraphItem.buyer.id,
                username: this.formatAddress(subgraphItem.buyer.id),
                avatar: subgraphItem.buyer.id, // Use address as seed
                rating: 100, reviews: 0, memberSince: 2024, dmtBalance: 0, stake: 0, lockedStake: 0, badges: [], reputationTier: 'none',
                createdAt: new Date().toISOString(), firstDealAt: new Date().toISOString(), goodReviewsCount: 0, badReviewsCount: 0, avgPaymentTime: 0, avgTransferTime: 0
            };
        }

        return listing;
    }

    private processIpfsUrl(url: string): string {
        if (url && url.startsWith('ipfs://')) {
            return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        return url;
    }

    private processImages(images: string[]): string[] {
        return images.map(img => this.processIpfsUrl(img)).filter(img => img && img !== 'undefined');
    }

    // --- BLOCKCHAIN INTERACTIONS (WRITE) ---

    private async uploadFileToBackend(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                console.warn("Upload API error:", text);
                if (window.location.hostname === 'localhost') {
                    return URL.createObjectURL(file);
                }
                throw new Error(`Ошибка загрузки: ${response.statusText}`);
            }

            const data = await response.json() as { ipfsUrl: string };
            if (!data.ipfsUrl) throw new Error('Некорректный ответ от сервера загрузки');
            return data.ipfsUrl;
        } catch (e) {
            console.error("Upload error:", e);
            if (window.location.hostname === 'localhost') {
                return URL.createObjectURL(file);
            }
            throw e;
        }
    }

    public async uploadMetadataToIpfs(metadata: object): Promise<string | null> {
        try {
            const response = await fetch('/api/upload-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata),
            });

            if (!response.ok) {
                console.warn("Metadata upload API error");
                if (window.location.hostname === 'localhost') {
                    const cid = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    localStorage.setItem(`metadata-${cid}`, JSON.stringify(metadata));
                    return cid;
                }
                throw new Error('Ошибка загрузки метаданных');
            }
            
            const data = await response.json() as { ipfsHash: string };
            return data.ipfsHash; 
        } catch (error) {
            console.error("Metadata upload error:", error);
            if (window.location.hostname === 'localhost') {
                const cid = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem(`metadata-${cid}`, JSON.stringify(metadata));
                return cid;
            }
            return null;
        }
    }

    public async createListingOnChain(
        listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'>,
        seller: User,
        imageFiles: File[],
        proofFile: File | undefined,
        videoFile: File | undefined,
        signer: Signer
    ): Promise<{ listingId: string; txHash: string }> {
        try {
            console.log("🔄 Начало создания объявления...");

            const uploadedImageUrls: string[] = [];
            for (const file of imageFiles) {
                const url = await this.uploadFileToBackend(file);
                uploadedImageUrls.push(url);
            }

            const finalImages = [...listingData.images, ...uploadedImageUrls].filter(Boolean);

            let proofCid = undefined;
            if (proofFile) {
                const proofUrl = await this.uploadFileToBackend(proofFile);
                proofCid = proofUrl; 
            }

            const metadata = {
                name: listingData.title,
                description: listingData.description,
                image: finalImages[0] || '',
                properties: {
                    ...listingData,
                    images: finalImages,
                    proofOfPurchaseCid: proofCid,
                    sellerAddress: seller.address,
                    sellerUsername: seller.username,
                    sellerAvatar: seller.avatar,
                    createdAt: new Date().toISOString()
                }
            };

            console.log("📤 Загрузка метаданных в IPFS...");
            const ipfsCid = await this.uploadMetadataToIpfs(metadata);
            if (!ipfsCid) {
                throw new Error('Не удалось загрузить метаданные в IPFS');
            }

            console.log("⛓️ Отправка транзакции в блокчейн...");
            const marketplace = new Contract(config.MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            
            const tokenAddress = listingData.currency === 'USDT' ? config.TOKENS.USDT : config.TOKENS.USDC;
            const priceWei = ethers.parseUnits(listingData.price.toFixed(6), 6);
            
            const tx = await marketplace.createListing(
                tokenAddress,
                priceWei,
                listingData.quantity,
                ipfsCid
            );

            console.log("⏳ Ожидание подтверждения транзакции...", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Транзакция подтверждена:", receipt);

            let listingId = 'pending';
            // Logic to parse ID from logs could go here
            return { listingId, txHash: tx.hash };

        } catch (error: any) {
            console.error("❌ Ошибка создания объявления:", error);
            if (error.code === 'ACTION_REJECTED') {
                throw new Error('Транзакция отклонена пользователем');
            }
            throw error;
        }
    }

    public async purchaseListingOnChain(listing: Listing, quantity: number, signer: Signer): Promise<{ txHash: string }> {
        try {
            console.log("🔄 Начало покупки...");

            const marketplaceAddress = config.MARKETPLACE_ADDRESS;
            const tokenAddress = listing.currency === 'USDT' ? config.TOKENS.USDT : config.TOKENS.USDC;
            
            const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
            const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);

            const buyerAddress = await signer.getAddress();
            
            const balance = await tokenContract.balanceOf(buyerAddress);
            const totalPriceWei = ethers.parseUnits((listing.price * quantity).toFixed(6), 6);

            if (balance < totalPriceWei) {
                throw new Error(`Недостаточно ${listing.currency}. Требуется: ${(listing.price * quantity).toFixed(2)}`);
            }

            const allowance = await tokenContract.allowance(buyerAddress, marketplaceAddress);
            
            if (allowance < totalPriceWei) {
                console.log("⛓️ Запрос разрешения (Approve)...");
                const approveTx = await tokenContract.approve(marketplaceAddress, totalPriceWei);
                await approveTx.wait();
                console.log("✅ Разрешение получено");
            }

            console.log("🛒 Выполнение покупки...");
            const buyTx = await marketplace.buy(listing.id, quantity);
            console.log("⏳ Ожидание подтверждения...", buyTx.hash);
            
            await buyTx.wait();
            console.log("✅ Покупка завершена!");

            return { txHash: buyTx.hash };

        } catch (error: any) {
            console.error("❌ Ошибка покупки:", error);
            if (error.code === 'ACTION_REJECTED') {
                throw new Error('Транзакция отклонена пользователем');
            }
            throw error;
        }
    }

    public async confirmReceiptOnChain(escrowId: string, signer: Signer): Promise<{ txHash: string }> {
        try {
            console.log("🔄 Подтверждение получения...");
            const marketplace = new Contract(config.MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            const tx = await marketplace.confirmReceipt(escrowId);
            await tx.wait();
            return { txHash: tx.hash };
        } catch (error: any) {
            console.error("❌ Ошибка подтверждения:", error);
            if (error.code === 'ACTION_REJECTED') {
                throw new Error('Транзакция отклонена пользователем');
            }
            throw error;
        }
    }

    public async cancelTradeOnChain(listingId: string, signer: Signer): Promise<{ txHash: string }> {
        try {
            console.log("🔄 Отмена сделки продавцом...");
            const marketplace = new Contract(config.MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            // Call cancelTrade on smart contract
            const tx = await marketplace.cancelTrade(listingId);
            console.log("⏳ Ожидание подтверждения отмены...", tx.hash);
            await tx.wait();
            console.log("✅ Сделка отменена, средства возвращены покупателю");
            return { txHash: tx.hash };
        } catch (error: any) {
            console.error("❌ Ошибка отмены сделки:", error);
            if (error.code === 'ACTION_REJECTED') {
                throw new Error('Транзакция отклонена пользователем');
            }
            throw error;
        }
    }

    public async getListingById(id: string): Promise<Listing | undefined> {
        try {
            const allListings = await this.getListings();
            return allListings.find(l => l.id === id);
        } catch (error) {
            return undefined;
        }
    }

    public async importListingFromIpfs(cid: string): Promise<Listing | null> {
        try {
            const metadata = await this.fetchIpfsMetadata(cid);
            return this.mapSubgraphDataToListing({
                id: 'preview-' + cid,
                price: metadata.properties?.price ? 
                    ethers.parseUnits(String(metadata.properties.price), 6).toString() : '0',
                token: config.TOKENS.USDC,
                quantity: '1',
                createdAt: Math.floor(Date.now() / 1000).toString(),
                seller: { id: 'preview' },
                ipfsCid: cid,
                status: 'Active'
            }, metadata);
        } catch (e) {
            console.error("Import failed", e);
            return null;
        }
    }
}

export const demarketService = new DeMarketService();
