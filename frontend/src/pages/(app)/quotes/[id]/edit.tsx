"use client"

import { useParams } from "react-router"
import { QuoteEditorPage } from "../_components/quote-editor-page"

export default function EditQuote() {
    const { id } = useParams<{ id: string }>()
    
    return <QuoteEditorPage quoteId={id} />
}

