
import { BigInt, BigDecimal, Bytes, ipfs, json, JSONValue, log } from "@graphprotocol/graph-ts"
import {
  ListingCreated,
  PurchaseInitiated,
  PurchaseCompleted,
  DisputeOpened,
  DisputeResolved,
  ReviewSubmitted,
  ProposalCreated,
  VoteCast
} from "../generated/DeMarket/DeMarket"
import { User, Listing, Purchase, Dispute, Review, Proposal, Vote } from "../generated/schema"

// --- HELPERS ---

function getOrCreateUser(address: string, timestamp: BigInt): User {
  let user = User.load(address)
  if (!user) {
    user = new User(address)
    user.address = Bytes.fromHexString(address)
    user.totalSales = 0
    user.totalPurchases = 0
    user.totalVolumeUSDC = BigInt.fromI32(0)
    user.averageRating = BigDecimal.fromString("0")
    user.reviewCount = 0
    user.joinedAt = timestamp
    user.save()
  }
  return user
}

// --- MARKETPLACE HANDLERS ---

export function handleListingCreated(event: ListingCreated): void {
  let seller = getOrCreateUser(event.params.seller.toHexString(), event.block.timestamp)
  
  let listing = new Listing(event.params.listingId.toString())
  listing.seller = seller.id
  listing.ipfsCid = event.params.ipfsCid
  listing.price = event.params.price
  listing.currency = event.params.currency
  listing.quantity = event.params.quantity
  listing.status = "Available"
  listing.createdAt = event.block.timestamp
  listing.updatedAt = event.block.timestamp

  // Indexing IPFS content for search
  let metadata = ipfs.cat(event.params.ipfsCid)
  if (metadata) {
    let value = json.fromBytes(metadata).toObject()
    let title = value.get("name")
    let desc = value.get("description")
    let category = value.get("category")
    
    let searchString = ""
    if (title) searchString += title.toString() + " "
    if (desc) searchString += desc.toString() + " "
    if (category) searchString += category.toString()
    
    listing.searchContent = searchString.toLowerCase()
  }

  listing.save()
}

export function handlePurchaseInitiated(event: PurchaseInitiated): void {
  let buyer = getOrCreateUser(event.params.buyer.toHexString(), event.block.timestamp)
  let listing = Listing.load(event.params.listingId.toString())
  
  if (listing) {
    // Decrease quantity or mark as InEscrow if it's a unique item
    // Simplification: for now, assuming uniqueness logic is in contract
    listing.status = "InEscrow"
    listing.save()

    let purchase = new Purchase(event.params.escrowId.toString())
    purchase.listing = listing.id
    purchase.buyer = buyer.id
    purchase.seller = listing.seller
    purchase.amount = event.params.amount
    purchase.quantity = event.params.quantity
    purchase.currency = listing.currency 
    purchase.status = "Active"
    purchase.createdAt = event.block.timestamp
    purchase.save()
  }
}

export function handlePurchaseCompleted(event: PurchaseCompleted): void {
  let purchase = Purchase.load(event.params.escrowId.toString())
  if (purchase) {
    purchase.status = "Completed"
    purchase.completedAt = event.block.timestamp
    purchase.save()

    // Update Seller Stats
    let seller = User.load(purchase.seller)
    if (seller) {
      seller.totalSales = seller.totalSales + 1
      seller.totalVolumeUSDC = seller.totalVolumeUSDC.plus(purchase.amount)
      if (!seller.firstDealTimestamp) {
        seller.firstDealTimestamp = event.block.timestamp
      }
      seller.save()
    }

    // Update Buyer Stats
    let buyer = User.load(purchase.buyer)
    if (buyer) {
      buyer.totalPurchases = buyer.totalPurchases + 1
      buyer.save()
    }
    
    let listing = Listing.load(purchase.listing)
    if (listing) {
        listing.status = "Sold"
        listing.save()
    }
  }
}

export function handleDisputeOpened(event: DisputeOpened): void {
  let dispute = new Dispute(event.params.escrowId.toString())
  let purchase = Purchase.load(event.params.escrowId.toString())
  
  if (purchase) {
    purchase.status = "Disputed"
    purchase.save()
    
    dispute.purchase = purchase.id
    dispute.initiator = event.params.initiator.toHexString()
    dispute.reason = event.params.reason
    dispute.status = "Negotiation"
    dispute.createdAt = event.block.timestamp
    dispute.save()
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
    let dispute = Dispute.load(event.params.escrowId.toString())
    if (dispute) {
        dispute.status = "Resolved"
        dispute.resolvedAt = event.block.timestamp
        // Determine winner based on who got funds (implied from contract logic)
        // Here we store the address of the winner passed in event if available
        // simplified for mapping example
        dispute.save()
    }
}

export function handleReviewSubmitted(event: ReviewSubmitted): void {
    let reviewId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let review = new Review(reviewId)
    
    review.purchase = event.params.listingId.toString() // assuming link via listing/escrow
    review.listing = event.params.listingId.toString()
    review.reviewer = event.params.reviewer.toHexString()
    review.reviewedUser = event.params.reviewedUser.toHexString()
    review.rating = event.params.rating
    review.comment = event.params.comment
    review.createdAt = event.block.timestamp
    review.save()

    // Dynamic Reputation
    let targetUser = User.load(event.params.reviewedUser.toHexString())
    if (targetUser) {
        let oldTotal = targetUser.averageRating.times(BigDecimal.fromString(targetUser.reviewCount.toString()))
        let newRating = BigDecimal.fromString(event.params.rating.toString())
        
        targetUser.reviewCount = targetUser.reviewCount + 1
        targetUser.averageRating = oldTotal.plus(newRating).div(BigDecimal.fromString(targetUser.reviewCount.toString()))
        targetUser.save()
    }
}

// --- DAO HANDLERS ---

export function handleProposalCreated(event: ProposalCreated): void {
    let proposal = new Proposal(event.params.proposalId.toString())
    
    let proposer = getOrCreateUser(event.params.proposer.toHexString(), event.block.timestamp)
    
    proposal.proposer = proposer.id
    proposal.title = event.params.title
    proposal.descriptionIpfsCid = event.params.descriptionCid
    proposal.status = "Active"
    proposal.votesFor = BigInt.fromI32(0)
    proposal.votesAgainst = BigInt.fromI32(0)
    proposal.createdAt = event.block.timestamp
    proposal.deadline = event.params.deadline
    proposal.save()
}

export function handleVoteCast(event: VoteCast): void {
    let voteId = event.params.proposalId.toString() + "-" + event.params.voter.toHexString()
    let vote = new Vote(voteId)
    
    let voter = getOrCreateUser(event.params.voter.toHexString(), event.block.timestamp)
    
    vote.proposal = event.params.proposalId.toString()
    vote.voter = voter.id
    vote.choice = event.params.support ? "For" : "Against"
    vote.weight = event.params.weight
    vote.timestamp = event.block.timestamp
    vote.save()

    let proposal = Proposal.load(event.params.proposalId.toString())
    if (proposal) {
        if (event.params.support) {
            proposal.votesFor = proposal.votesFor.plus(event.params.weight)
        } else {
            proposal.votesAgainst = proposal.votesAgainst.plus(event.params.weight)
        }
        proposal.save()
    }
}
