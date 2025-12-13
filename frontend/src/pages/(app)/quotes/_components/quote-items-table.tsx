"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { QuoteItemType } from "@/types"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, List, Link, Heading1, Heading2, Code, Quote } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface QuoteItem {
    id?: string
    description: string
    type: string
    quantity: number
    unitPrice: number
    vatRate: number
    order: number
}

interface QuoteItemsTableProps {
    items: QuoteItem[]
    billingType: "RAPIDE" | "COMPLET" | "ELECTRONIC"
    vatExemptionReason: string
    currency: string
    primaryColor?: string
    secondaryColor?: string
    tableTextColor?: string
    onUpdateItem: (index: number, field: string, value: any) => void
    onRemoveItem: (index: number) => void
    onAddItem: () => void
    onAddSection: () => void
}

function MarkdownToolbar({ 
    onBold, 
    onItalic, 
    onHeading1, 
    onHeading2, 
    onList, 
    onCode, 
    onQuote, 
    onInsertLink 
}: {
    onBold: () => void
    onItalic: () => void
    onHeading1: () => void
    onHeading2: () => void
    onList: () => void
    onCode: () => void
    onQuote: () => void
    onInsertLink: (text: string, url: string) => void
}) {
    const [showLinkDialog, setShowLinkDialog] = useState(false)
    const [linkText, setLinkText] = useState("")
    const [linkUrl, setLinkUrl] = useState("")

    const handleInsertLink = () => {
        if (linkText && linkUrl) {
            onInsertLink(linkText, linkUrl)
        } else if (linkUrl) {
            onInsertLink("", linkUrl)
        }
        setShowLinkDialog(false)
        setLinkText("")
        setLinkUrl("")
    }

    return (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50 rounded-t-lg">
            <Button type="button" variant="ghost" size="sm" onClick={onBold} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Gras">
                <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onItalic} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Italique">
                <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button type="button" variant="ghost" size="sm" onClick={onHeading1} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Titre 1">
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onHeading2} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Titre 2">
                <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button type="button" variant="ghost" size="sm" onClick={onList} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Liste">
                <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCode} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Code">
                <Code className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onQuote} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Citation">
                <Quote className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkDialog(true)} className="h-8 w-8 p-0 hover:bg-primary/20 text-foreground" title="Lien">
                        <Link className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="link-text">Texte du lien</Label>
                            <Input id="link-text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Texte à afficher" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="link-url">URL</Label>
                            <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="mt-1" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkDialog(false)}>Annuler</Button>
                            <Button type="button" size="sm" onClick={handleInsertLink}>Insérer</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export function QuoteItemsTable({
    items,
    billingType,
    vatExemptionReason,
    currency,
    primaryColor = "#6366f1",
    secondaryColor = "#e0e7ff",
    tableTextColor = "#ffffff",
    onUpdateItem,
    onRemoveItem,
    onAddItem,
    onAddSection,
}: QuoteItemsTableProps) {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

    const insertMarkdown = (index: number, before: string, after: string = "") => {
        const item = items[index]
        const textarea = document.querySelector(`textarea[data-item-index="${index}"]`) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = item.description.substring(start, end)
        const newText = item.description.substring(0, start) + before + selectedText + after + item.description.substring(end)
        onUpdateItem(index, "description", newText)

        setTimeout(() => {
            textarea.focus()
            const newCursorPos = start + before.length + selectedText.length + after.length
            textarea.setSelectionRange(newCursorPos, newCursorPos)
        }, 0)
    }

    const handleMarkdownAction = (index: number, action: string) => {
        const item = items[index]
        const textarea = document.querySelector(`textarea[data-item-index="${index}"]`) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const lineStart = item.description.lastIndexOf("\n", start - 1) + 1
        const lineEnd = item.description.indexOf("\n", start)
        const line = item.description.substring(lineStart, lineEnd === -1 ? item.description.length : lineEnd)

        switch (action) {
            case "bold":
                insertMarkdown(index, "**", "**")
                break
            case "italic":
                insertMarkdown(index, "*", "*")
                break
            case "heading1":
                const newText1 = item.description.substring(0, lineStart) + "# " + line + item.description.substring(lineEnd === -1 ? item.description.length : lineEnd)
                onUpdateItem(index, "description", newText1)
                break
            case "heading2":
                const newText2 = item.description.substring(0, lineStart) + "## " + line + item.description.substring(lineEnd === -1 ? item.description.length : lineEnd)
                onUpdateItem(index, "description", newText2)
                break
            case "list":
                const newText3 = item.description.substring(0, lineStart) + "- " + item.description.substring(lineStart)
                onUpdateItem(index, "description", newText3)
                break
            case "code":
                insertMarkdown(index, "`", "`")
                break
            case "quote":
                const newText4 = item.description.substring(0, lineStart) + "> " + item.description.substring(lineStart)
                onUpdateItem(index, "description", newText4)
                break
        }
    }

    const handleInsertLink = (index: number, linkText: string, linkUrl: string) => {
        if (linkText && linkUrl) {
            insertMarkdown(index, `[${linkText}](`, linkUrl + ")")
        } else if (linkUrl) {
            insertMarkdown(index, "[", `](${linkUrl})`)
        }
    }

    return (
        <div className="mb-6">
            <div className="rounded-lg overflow-hidden border border-border shadow-sm">
                <table className="w-full border-collapse">
                    <thead style={{ backgroundColor: primaryColor, color: tableTextColor }}>
                        <tr>
                            {billingType === "COMPLET" && (
                                <th className="text-left py-3 px-4 text-sm font-semibold w-32">Type</th>
                            )}
                            <th className="text-left py-3 px-4 text-sm font-semibold tracking-wide">Désignation</th>
                            {billingType === "COMPLET" && (
                                <th className="text-right py-3 px-4 text-sm font-semibold w-24">Qté</th>
                            )}
                            {vatExemptionReason === "none" && (
                                <th className="text-right py-3 px-4 text-sm font-semibold w-24">TVA</th>
                            )}
                            <th className="text-right py-3 px-4 text-sm font-semibold w-32">Montant HT</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-card">
                        {items.map((item, index) => (
                            item.type === QuoteItemType.SECTION ? (
                                <tr key={index} className="border-b-2 border-primary/20 group">
                                    <td 
                                        className="py-4 px-4" 
                                        style={{ backgroundColor: secondaryColor }}
                                        colSpan={billingType === "COMPLET" ? (vatExemptionReason === "none" ? 6 : 5) : (vatExemptionReason === "none" ? 4 : 3)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={item.description}
                                                onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                                                placeholder="Titre de la section / Désignation"
                                                className="border-0 focus:ring-0 rounded-none px-0 h-auto text-lg font-bold italic w-full bg-transparent placeholder:text-muted-foreground/50 py-2"
                                                style={{ color: primaryColor }}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRemoveItem(index)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={index} className="border-b border-border/50 group hover:bg-muted/30 transition-colors">
                                    {billingType === "COMPLET" && (
                                        <td className="py-3 px-4">
                                            <Select value={item.type || "SERVICE"} onValueChange={(val) => onUpdateItem(index, "type", val)}>
                                                <SelectTrigger className="h-9 border-border focus:border-primary">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SERVICE">Prestation</SelectItem>
                                                    <SelectItem value="GOOD">Bien</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <div 
                                            className={`relative border rounded-lg overflow-hidden transition-all bg-background ${
                                                focusedIndex === index 
                                                    ? 'border-primary ring-2 ring-primary/20 shadow-md' 
                                                    : 'border-border hover:border-primary/50'
                                            }`}
                                        >
                                            {focusedIndex === index && (
                                                <MarkdownToolbar
                                                    onBold={() => handleMarkdownAction(index, "bold")}
                                                    onItalic={() => handleMarkdownAction(index, "italic")}
                                                    onHeading1={() => handleMarkdownAction(index, "heading1")}
                                                    onHeading2={() => handleMarkdownAction(index, "heading2")}
                                                    onList={() => handleMarkdownAction(index, "list")}
                                                    onCode={() => handleMarkdownAction(index, "code")}
                                                    onQuote={() => handleMarkdownAction(index, "quote")}
                                                    onInsertLink={(text, url) => handleInsertLink(index, text, url)}
                                                />
                                            )}
                                            <Textarea
                                                data-item-index={index}
                                                value={item.description}
                                                onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                                                placeholder="Description (Markdown supporté)"
                                                className="min-h-[60px] border-0 focus-visible:ring-0 resize-none text-sm bg-background text-foreground placeholder:text-muted-foreground/60 font-normal"
                                                onFocus={() => setFocusedIndex(index)}
                                                onBlur={() => setFocusedIndex(null)}
                                            />
                                        </div>
                                    </td>
                                    {billingType === "COMPLET" && (
                                        <td className="py-3 px-4">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => onUpdateItem(index, "quantity", Number(e.target.value))}
                                                className="text-right h-9 border-border focus:border-primary"
                                            />
                                        </td>
                                    )}
                                    {vatExemptionReason === "none" && (
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Input
                                                    type="number"
                                                    value={item.vatRate || ""}
                                                    onChange={(e) => onUpdateItem(index, "vatRate", Number(e.target.value) || 0)}
                                                    className="text-right h-9 w-16 border-border focus:border-primary"
                                                />
                                                <span className="text-sm text-muted-foreground">%</span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={item.unitPrice || ""}
                                                onChange={(e) => onUpdateItem(index, "unitPrice", Number(e.target.value) || 0)}
                                                className="text-right h-9 border-border focus:border-primary font-medium"
                                            />
                                            <span className="text-sm text-muted-foreground">{currency}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onRemoveItem(index)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-2 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAddItem}
                    className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-medium"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Ligne simple
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAddSection}
                    className="border-border text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                >
                    Ligne de désignation
                </Button>
            </div>
        </div>
    )
}

