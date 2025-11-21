import { BigInt, BigDecimal, Bytes, Value, ipfs, json, log } from "@graphprotocol/graph-ts"
import {
  ListingCreated,
  ListingUpdated,
  PurchaseInitiated,
  PurchaseCompleted,
  DisputeOpened,
  DisputeResolved
} from "../generated/DeMarketMarketplace/DeMarketMarketplace"
import { ReviewSubmitted } from "../generated/ReputationReview/ReputationReview"
import { ProposalCreated, VoteCast } from "../generated/DeMarketDAO/DeMarketDAO"
import { User, Listing, Purchase, Dispute, Review, Proposal, Vote } from "../generated/schema"

// --- HELPERS ---

function getOrCreateUser(address: string, timestamp: BigInt): User {
  let user = User.load(address)
  if (!user) {
    user = new User(address)
    user.totalSales = 0
    user.totalPurchases = 0
    user.totalVolumeUSDC = BigInt.fromI32(0)
    user.averageRating = BigDecimal.fromString("0")
    user.reviewCount = 0
    user.joinedAt = timestamp
    user.reputationTier = "None"
    user.save()
  }
  return user
}

// --- MARKETPLACE HANDLERS ---

export function handleListingCreated(event: ListingCreated): void {
  let seller = getOrCreateUser(event.params.seller.toHexString(), event.block.timestamp)
  
  let listing = new Listing(event.params.listingId.toString())
  listing.seller = seller.id
  listing.token = event.params.token
  listing.price = event.params.price
  listing.quantity = BigInt.fromI32(1) // Default to 1 if quantity not in event, but our contract has it. 
  // Note: The event definition in yaml must match solidity.
  // In our contract: event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price, address token, string ipfsCid);
  // Quantity is NOT in the event in the provided Solidity code (createListing emits ListingCreated).
  // Optimization: We should add quantity to the event in Solidity in V2. For now we default or fetch if possible.
  
  listing.set("currency", Value.fromString("USDC")) // Исправлено
  listing.ipfsCid = event.params.ipfsCid
  listing.status = "Active"
  listing.createdAt = event.block.timestamp
  listing.updatedAt = event.block.timestamp

  // Attempt to fetch search content from IPFS
  // Note: IPFS fetching in graph-ts is deterministic and might fail if file not pinned.
  listing.searchContent = event.params.ipfsCid
  
  listing.save()
}

export function handleListingUpdated(event: ListingUpdated): void {
  let listing = Listing.load(event.params.listingId.toString())
  if (listing) {
    listing.price = event.params.newPrice
    listing.quantity = event.params.newQuantity
    listing.updatedAt = event.block.timestamp
    listing.save()
  }
}

export function handlePurchaseInitiated(event: PurchaseInitiated): void {
  let buyer = getOrCreateUser(event.params.buyer.toHexString(), event.block.timestamp)
  let listing = Listing.load(event.params.listingId.toString())
  
  if (listing) {
    let purchase = new Purchase(event.params.escrowId.toString())
    purchase.listing = listing.id
    purchase.buyer = buyer.id
    // Assuming seller is in the event or derived from listing
    purchase.seller = event.params.seller // Исправлено
    purchase.amount = event.params.amount
    purchase.token = listing.token
    purchase.status = "Funded"
    purchase.createdAt = event.block.timestamp
    purchase.save()
    
    // Update listing status
    listing.status = "InEscrow" 
    listing.save()
  }
}

export function handlePurchaseCompleted(event: PurchaseCompleted): void {
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
    purchase.status = "Completed"
    purchase.completedAt = event.block.timestamp
    purchase.save()

    let seller = getOrCreateUser(event.params.seller.toHexString(), event.block.timestamp)
    seller.totalSales = seller.totalSales + 1
    seller.totalVolumeUSDC = seller.totalVolumeUSDC.plus(event.params.amount)
    seller.save()

    let buyer = getOrCreateUser(event.params.buyer.toHexString(), event.block.timestamp)
    buyer.totalPurchases = buyer.totalPurchases + 1
    buyer.save()
    
    let listing = Listing.load(purchase.listing)
    if (listing) {
        listing.status = "Sold"
        listing.save()
    }
  }
}

export function handleDisputeOpened(event: DisputeOpened): void {
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
    purchase.status = "Disputed"
    purchase.save()

    let dispute = new Dispute(event.params.disputeId.toString())
    dispute.purchase = purchase.id
    dispute.initiator = getOrCreateUser(event.params.initiator.toHexString(), event.block.timestamp).id
    dispute.reasonCid = "ipfs-content" // Reason CID not in top level event, would need call handler
    dispute.status = "Recruiting"
    dispute.createdAt = event.block.timestamp
    dispute.save()
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
      // Dispute ID linking is tricky without storing it in Purchase, 
      // but we can query Disputes linked to this purchase
      purchase.status = "Resolved"
      purchase.save()
  }
}

// --- REPUTATION HANDLERS ---

export function handleReviewSubmitted(event: ReviewSubmitted): void {
  let reviewId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let review = new Review(reviewId)
  
  // Linking to purchase might require storing escrowId in event
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
      review.purchase = purchase.id
  } else {
      // Fallback or error handling
      return 
  }

  review.reviewer = getOrCreateUser(event.params.reviewer.toHexString(), event.block.timestamp).id
  review.reviewedUser = getOrCreateUser(event.params.subject.toHexString(), event.block.timestamp).id
  review.rating = event.params.rating
  review.commentCid = event.params.commentCid
  review.createdAt = event.block.timestamp
  review.save()

  // Recalculate Average Rating
  let subject = User.load(event.params.subject.toHexString())
  if (subject) {
      let totalRating = subject.averageRating.times(BigDecimal.fromString(subject.reviewCount.toString()))
      let newRating = BigDecimal.fromString(event.params.rating.toString())
      let newCount = BigDecimal.fromString((subject.reviewCount + 1).toString())
      
      subject.reviewCount = subject.reviewCount + 1
      subject.averageRating = totalRating.plus(newRating).div(newCount)
      
      // Update Tier
      if (subject.reviewCount >= 50 && subject.averageRating >= BigDecimal.fromString("98")) subject.reputationTier = "Gold"
      else if (subject.reviewCount >= 20 && subject.averageRating >= BigDecimal.fromString("95")) subject.reputationTier = "Silver"
      else if (subject.reviewCount >= 5 && subject.averageRating >= BigDecimal.fromString("90")) subject.reputationTier = "Bronze"
      
      subject.save()
  }
}

// --- DAO HANDLERS ---

export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = new Proposal(event.params.proposalId.toString())
  proposal.proposer = getOrCreateUser(event.params.proposer.toHexString(), event.block.timestamp).id
  proposal.description = event.params.description
  proposal.status = "Active" // Governor logic is complex, simplifying for MVP
  proposal.votesFor = BigInt.fromI32(0)
  proposal.votesAgainst = BigInt.fromI32(0)
  proposal.startBlock = event.params.voteStart
  proposal.endBlock = event.params.voteEnd
  proposal.createdAt = event.block.timestamp
  proposal.save()
}

export function handleVoteCast(event: VoteCast): void {
  let voteId = event.params.proposalId.toString() + "-" + event.params.voter.toHexString()
  let vote = new Vote(voteId)
  vote.proposal = event.params.proposalId.toString()
  vote.voter = getOrCreateUser(event.params.voter.toHexString(), event.block.timestamp).id
  vote.support = event.params.support == 1 ? true : false // 0=Against, 1=For, 2=Abstain
  vote.weight = event.params.weight
  vote.reason = event.params.reason
  vote.timestamp = event.block.timestamp
  vote.save()

  let proposal = Proposal.load(event.params.proposalId.toString())
  if (proposal) {
      if (event.params.support == 1) {
          proposal.votesFor = proposal.votesFor.plus(event.params.weight)
      } else if (event.params.support == 0) {
          proposal.votesAgainst = proposal.votesAgainst.plus(event.params.weight)
      }
      proposal.save()
  }
}