import {
    PropertyRegistered as PropertyRegisteredEvent,
    MetadataUpdated as MetadataUpdatedEvent,
    Purchase as PurchaseEvent,
} from "../generated/PropertyToken1/PropertyToken"
import { PropertyAsset, PropertyShare, Owner, Purchase, MetadataCID } from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handlePropertyRegistered(event: PropertyRegisteredEvent): void {
    let contractAddr = event.address as Bytes
    let property = PropertyAsset.load(contractAddr.toHex())
    if (!property) {
        property = new PropertyAsset(contractAddr.toHex())
    }
    property.contract = contractAddr
    property.name = event.params.name
    property.location = event.params.location
    property.jurisdiction = event.params.jurisdiction
    property.issuer = event.params.issuer
    property.totalShares = event.params.totalShares
    property.image = event.params.image
    property.latestMetadataCid = event.params.latestMetadataCid
    property.save()
}

export function handlePurchase(event: PurchaseEvent): void {
    let contractAddr = event.address as Bytes
    let property = PropertyAsset.load(contractAddr.toHex())
    if (!property) {
        property = new PropertyAsset(contractAddr.toHex())
        property.contract = contractAddr
        property.save()
    }

    // Owner
    let buyerId = event.params.buyer.toHex()
    let owner = Owner.load(buyerId)
    if (!owner) {
        owner = new Owner(buyerId)
        owner.save()
    }

    // PropertyShare
    let shareId = contractAddr.toHex() + "-" + event.params.tokenId.toString()
    let share = new PropertyShare(shareId)
    share.property = property.id
    share.tokenId = event.params.tokenId
    share.owner = owner.id
    share.mintedAt = event.block.timestamp
    share.contract = contractAddr
    share.save()

    // Purchase entity
    let purchaseId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let purchase = new Purchase(purchaseId)
    purchase.buyer = owner.id
    purchase.share = share.id
    purchase.timestamp = event.block.timestamp
    purchase.contract = contractAddr
    purchase.save()
}

export function handleMetadataUpdated(event: MetadataUpdatedEvent): void {
    let contractAddr = event.address as Bytes
    let property = PropertyAsset.load(contractAddr.toHex())
    if (property) {
        property.latestMetadataCid = event.params.latestMetadataCid
        property.save()
    }

    // Optionally track history
    let metaId = contractAddr.toHex() + "-" + event.block.timestamp.toString()
    let meta = new MetadataCID(metaId)
    meta.id = contractAddr.toHex()
    meta.cid = event.params.latestMetadataCid
    meta.updatedAt = event.params.updatedAt
    meta.save()
}
