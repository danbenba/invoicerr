import { Currency, ItemType } from "../../../../prisma/generated/prisma/client";

export class CreateQuoteDto {
    // number is auto generated
    title?: string;
    clientId: string;
    validUntil?: Date;
    currency?: Currency;
    paymentMethod?: string;
    paymentDetails?: string;
    paymentMethodId?: string;
    notes: string;
    createdAt?: Date;
    vatExemptionReason?: string;
    vatExemptionText?: string;
    footerText?: string;
    billingType?: string;
    clientOptions?: string;
    complementaryOptions?: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        type: ItemType;
        order: number;
    }[];
}

export class EditQuotesDto {
    id: string;
    title?: string;
    clientId: string;
    validUntil?: Date;
    currency?: Currency;
    paymentMethod?: string;
    paymentDetails?: string;
    paymentMethodId?: string;
    createdAt?: Date;
    vatExemptionReason?: string;
    vatExemptionText?: string;
    footerText?: string;
    billingType?: string;
    clientOptions?: string;
    complementaryOptions?: string;
    items: {
        id?: string; // Optional for new items
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        type: ItemType;
        order: number;
    }[];
}