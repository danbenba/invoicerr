"use client"

import { useParams } from "react-router"
import { InvoiceEditorPage } from "../_components/invoice-editor-page"

export default function EditInvoice() {
    const { id } = useParams<{ id: string }>()
    
    return <InvoiceEditorPage invoiceId={id} />
}

