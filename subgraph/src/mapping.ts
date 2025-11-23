
import { BigInt, BigDecimal, Bytes, ipfs, json, log } from "@graphprotocol/graph-ts"
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
    // Initialize new fields
    user.goodReviewsCount = 0
    user.badReviewsCount = 0
    user.avgPaymentTime = BigDecimal.fromString("0")
    user.avgTransferTime = BigDecimal.fromString("0")
    user.createdAt = timestamp
    user.firstDealAt = BigInt.fromI32(0)
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
  listing.quantity = BigInt.fromI32(1) 
  listing.currency = "USDC"
  listing.ipfsCid = event.params.ipfsCid
  listing.status = "Active"
  listing.createdAt = event.block.timestamp
  listing.updatedAt = event.block.timestamp
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
  
  // Update buyer first deal if needed
  if (buyer.firstDealAt.equals(BigInt.fromI32(0))) {
      buyer.firstDealAt = event.block.timestamp
      buyer.save()
  }

  let listing = Listing.load(event.params.listingId.toString())
  
  if (listing) {
    let purchase = new Purchase(event.params.escrowId.toString())
    purchase.listing = listing.id
    purchase.buyer = buyer.id
    purchase.seller = event.params.seller.toHexString() 
    purchase.amount = event.params.amount
    purchase.token = listing.token
    purchase.status = "Funded"
    purchase.createdAt = event.block.timestamp
    purchase.save()
    
    // Update listing status and link buyer
    listing.status = "InEscrow" 
    listing.buyer = buyer.id // Link the buyer directly to listing for easier UI queries
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
    if (seller.firstDealAt.equals(BigInt.fromI32(0))) {
        seller.firstDealAt = event.block.timestamp
    }
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
    dispute.reasonCid = "ipfs-content" 
    dispute.status = "Recruiting"
    dispute.createdAt = event.block.timestamp
    dispute.save()
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
      purchase.status = "Resolved"
      purchase.save()
  }
}

export function handleReviewSubmitted(event: ReviewSubmitted): void {
  let reviewId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let review = new Review(reviewId)
  
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
      review.purchase = purchase.id
  } else {
      return 
  }

  review.reviewer = getOrCreateUser(event.params.reviewer.toHexString(), event.block.timestamp).id
  review.reviewedUser = getOrCreateUser(event.params.subject.toHexString(), event.block.timestamp).id
  
  // FIX: Explicitly convert i32 (uint8) to BigInt
  review.rating = BigInt.fromI32(event.params.rating)
  
  review.commentCid = event.params.commentCid
  review.createdAt = event.block.timestamp
  review.save()

  // Recalculate Average Rating & Counts
  let subject = User.load(event.params.subject.toHexString())
  if (subject) {
      let totalRating = subject.averageRating.times(BigDecimal.fromString(subject.reviewCount.toString()))
      let newRating = BigDecimal.fromString(event.params.rating.toString())
      let newCount = BigDecimal.fromString((subject.reviewCount + 1).toString())
      
      subject.reviewCount = subject.reviewCount + 1
      subject.averageRating = totalRating.plus(newRating).div(newCount)
      
      // Update Good/Bad counts
      if (event.params.rating >= 50) {
          subject.goodReviewsCount = subject.goodReviewsCount + 1
      } else {
          subject.badReviewsCount = subject.badReviewsCount + 1
      }

      // Update Tier logic
      if (subject.reviewCount >= 50 && subject.averageRating >= BigDecimal.fromString("98")) subject.reputationTier = "Gold"
      else if (subject.reviewCount >= 20 && subject.averageRating >= BigDecimal.fromString("95")) subject.reputationTier = "Silver"
      else if (subject.reviewCount >= 5 && subject.averageRating >= BigDecimal.fromString("90")) subject.reputationTier = "Bronze"
      
      subject.save()
  }
}

export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = new Proposal(event.params.proposalId.toString())
  proposal.proposer = getOrCreateUser(event.params.proposer.toHexString(), event.block.timestamp).id
  proposal.description = event.params.description
  proposal.status = "Active"
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
  vote.support = event.params.support == 1 ? true : false 
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
