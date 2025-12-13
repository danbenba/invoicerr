"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { useGet, usePost, usePatch } from "@/hooks/use-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, Download, Upload, Settings, FileText, User, Languages, AlignLeft, Info, Maximize2, Minimize2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { Company, Client } from "@/types"
import { QuoteItemType } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { ClientUpsert } from "../../clients/_components/client-upsert"
import { DatePicker } from "@/components/date-picker"
import { QuoteItemsTable } from "./quote-items-table"

interface QuoteEditorPageProps {
    quoteId?: string
}

export function QuoteEditorPage({ quoteId }: QuoteEditorPageProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const isEdit = !!quoteId

    const { data: company } = useGet<Company>("/api/company/info")
    const { data: pdfConfig } = useGet<any>("/api/company/pdf-template")
    const { data: quote } = useGet<any>(quoteId ? `/api/quotes/${quoteId}` : null)
    const { data: quoteSettings } = useGet<any>("/api/company/quote-settings")
    const [searchTerm, setSearchTerm] = useState("")
    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${searchTerm}`)

    const { trigger: createTrigger } = usePost("/api/quotes")
    const { trigger: updateTrigger } = usePatch(`/api/quotes/${quoteId}`)

    // État local pour l'édition
    const [localCompany, setLocalCompany] = useState({
        name: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        email: "",
        phone: "",
        legalId: "",
        VAT: "",
        logoB64: "",
        includeLogo: false,
    })

    const [localClient, setLocalClient] = useState({
        name: "",
        address: "",
        complement: "",
        city: "",
        postalCode: "",
        country: "",
        email: "",
        phone: "",
    })
    const [openClientSearch, setOpenClientSearch] = useState(false)

    // Sidebar Options State - Load from localStorage or defaults
    const loadOptionsFromStorage = () => {
        const stored = localStorage.getItem('quoteEditorOptions')
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch (e) {
                console.error('Failed to parse stored options', e)
            }
        }
        return null
    }

    const defaultOptions = {
        billingType: "COMPLET",
        clientOptions: {
            deliveryAddress: true,
            siret: true,
            vat: true
        },
        language: "fr",
        complementaryOptions: {
            acceptance: true,
            signature: true,
            title: true,
            freeField: true,
            globalDiscount: false
        }
    }

    const storedOptions = loadOptionsFromStorage()
    const [billingType, setBillingType] = useState(storedOptions?.billingType || defaultOptions.billingType)
    const [clientOptions, setClientOptions] = useState(storedOptions?.clientOptions || defaultOptions.clientOptions)
    const [language, setLanguage] = useState(storedOptions?.language || defaultOptions.language)
    const [complementaryOptions, setComplementaryOptions] = useState(storedOptions?.complementaryOptions || defaultOptions.complementaryOptions)

    // Save options to localStorage whenever they change
    useEffect(() => {
        const optionsToSave = {
            billingType,
            clientOptions,
            language,
            complementaryOptions
        }
        localStorage.setItem('quoteEditorOptions', JSON.stringify(optionsToSave))
    }, [billingType, clientOptions, language, complementaryOptions])

    const [quoteData, setQuoteData] = useState({
        title: "",
        clientId: "",
        currency: "EUR",
        validUntil: null as Date | null,
        notes: "",
        paymentMethodId: "",
        vatExemptionReason: "not_subject",
        vatExemptionText: "TVA non applicable, art. 293 B du CGI",
        footerText: quoteSettings?.defaultFooterText || "",
        createdAt: new Date(),
        items: [] as Array<{
            id?: string
            description: string
            type: string
            quantity: number
            unitPrice: number
            vatRate: number
            order: number
        }>,
    })

    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Initialiser les données
    useEffect(() => {
        if (company) {
            setLocalCompany({
                name: company.name || "",
                address: company.address || "",
                city: company.city || "",
                postalCode: company.postalCode || "",
                country: company.country || "",
                email: company.email || "",
                phone: company.phone || "",
                legalId: (company as any).legalId || "",
                VAT: company.VAT || "",
                logoB64: pdfConfig?.logoB64 || "",
                includeLogo: pdfConfig?.includeLogo || false,
            })
        }
    }, [company, pdfConfig])

    useEffect(() => {
        if (quoteSettings?.defaultFooterText) {
            setQuoteData(prev => ({
                ...prev,
                footerText: prev.footerText || quoteSettings.defaultFooterText || "Atou Services 21"
            }))
        }
    }, [quoteSettings])

    useEffect(() => {
        if (isEdit && quote) {
            if (quote.billingType) setBillingType(quote.billingType)
            if (quote.clientOptions) {
                try {
                    setClientOptions(JSON.parse(quote.clientOptions))
                } catch (e) {
                    console.error("Failed to parse client options", e)
                }
            }
            if (quote.complementaryOptions) {
                try {
                    setComplementaryOptions(JSON.parse(quote.complementaryOptions))
                } catch (e) {
                    console.error("Failed to parse complementary options", e)
                }
            }

            setQuoteData({
                title: quote.title || "",
                clientId: quote.clientId || "",
                currency: quote.currency || "EUR",
                validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
                createdAt: quote.createdAt ? new Date(quote.createdAt) : new Date(),
                notes: quote.notes || "",
                paymentMethodId: quote.paymentMethodId || "",
                vatExemptionReason: quote.vatExemptionReason || "not_subject",
                vatExemptionText: quote.vatExemptionText || "TVA non applicable, art. 293 B du CGI",
                footerText: quote.footerText || quoteSettings?.defaultFooterText || "Atou Services 21",
                items: quote.items
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((item: any) => ({
                        id: item.id,
                        description: item.description || "",
                        type: item.type,
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        vatRate: item.vatRate || 0,
                        order: item.order || 0,
                    })),
            })
        }
    }, [quote, isEdit])

    // Calculs des totaux
    const totals = useMemo(() => {
        const totalHT = quoteData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice)
        }, 0)

        const totalVAT = quoteData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice * item.vatRate / 100)
        }, 0)

        const totalTTC = totalHT + totalVAT

        return {
            totalHT: totalHT.toFixed(2),
            totalVAT: totalVAT.toFixed(2),
            totalTTC: totalTTC.toFixed(2),
        }
    }, [quoteData.items])

    const selectedClient = clients?.find(c => c.id === quoteData.clientId)

    useEffect(() => {
        if (selectedClient) {
            setLocalClient({
                name: selectedClient.name || (selectedClient.contactFirstname + " " + selectedClient.contactLastname),
                address: selectedClient.address || "",
                complement: "",
                city: selectedClient.city || "",
                postalCode: selectedClient.postalCode || "",
                country: selectedClient.country || "",
                email: selectedClient.contactEmail || "",
                phone: selectedClient.contactPhone || ""
            })
        }
    }, [selectedClient])

    // Gestion du logo
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setLocalCompany(prev => ({ ...prev, logoB64: base64, includeLogo: true }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveLogo = () => {
        setLocalCompany(prev => ({ ...prev, logoB64: "", includeLogo: false }))
    }

    // Ajouter une ligne simple (Service)
    const addItem = () => {
        setQuoteData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    description: "",
                    type: QuoteItemType.SERVICE,
                    quantity: 1,
                    unitPrice: 0,
                    vatRate: 20,
                    order: prev.items.length,
                }
            ]
        }))
    }


    // Supprimer une ligne
    const removeItem = (index: number) => {
        setQuoteData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    // Mettre à jour une ligne
    const updateItem = (index: number, field: string, value: any) => {
        setQuoteData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }))
    }

    // Sauvegarder
    const handleSave = async () => {
        if (!quoteData.clientId) {
            toast.error(t("quotes.upsert.form.client.errors.required"))
            return
        }

        const data = {
            ...quoteData,
            billingType,
            clientOptions: JSON.stringify(clientOptions),
            complementaryOptions: JSON.stringify(complementaryOptions),
            validUntil: quoteData.validUntil,
            createdAt: quoteData.createdAt, // Save date
            items: quoteData.items.map((item, index) => ({
                ...item,
                order: index,
            })),
        }

        try {
            if (isEdit) {
                await updateTrigger(data)
                toast.success(t("quotes.upsert.messages.updateSuccess"))
            } else {
                await createTrigger(data)
                toast.success(t("quotes.upsert.messages.createSuccess"))
            }
            navigate("/quotes")
        } catch (error) {
            console.error(error)
            toast.error(t(`quotes.upsert.messages.${isEdit ? "updateError" : "createError"}`))
        }
    }

    // Exporter en PDF
    const handleExport = async () => {
        // D'abord sauvegarder si nouveau devis
        if (!isEdit) {
            if (!quoteData.clientId) {
                toast.error(t("quotes.upsert.form.client.errors.required"))
                return
            }
            try {
                const result: any = await createTrigger({
                    ...quoteData,
                    validUntil: quoteData.validUntil,
                    items: quoteData.items.map((item, index) => ({
                        ...item,
                        order: index,
                    })),
                })
                // Rediriger vers le PDF
                if (result?.id) {
                    window.open(`/api/quotes/${result.id}/pdf`, "_blank")
                } else {
                    toast.error(t("quotes.upsert.messages.createError"))
                }
            } catch (error) {
                console.error(error)
                toast.error(t("quotes.upsert.messages.createError"))
            }
        } else {
            window.open(`/api/quotes/${quoteId}/pdf`, "_blank")
        }
    }

    const handleClientSelect = (client: Client) => {
        setQuoteData(prev => ({ ...prev, clientId: client.id }))
        setOpenClientSearch(false)
        setSearchTerm("")
    }

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang)
        i18n.changeLanguage(lang)
    }

    return (
        <>
            <div className="min-h-screen bg-background">
                <main className="flex mx-auto py-6" style={{ gap: '20px', width: isFullscreen ? '100%' : '1170px', transition: 'width 300ms', maxWidth: isFullscreen ? '100%' : '1170px' }}>
                    {/* Document Container */}
                    <div className={`flex-1 ${isFullscreen ? 'fixed inset-0 z-50 bg-background overflow-auto p-6' : ''}`}>
                        <div className="document-wrapper" style={{ height: isFullscreen ? 'auto' : 'calc(100vh - 100px)', overflowY: 'auto' }}>
                            <div className={`document bg-card border border-border relative flex flex-col ${isFullscreen ? 'w-full max-w-[1200px] mx-auto' : ''}`} style={{ width: isFullscreen ? '100%' : '900px', minHeight: '1272.86px', margin: '0 auto', padding: '40px' }}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="absolute top-4 right-4 z-10"
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                                <div className="flex-1">
                                {/* En-tête du document */}
                                <div className="mb-8">
                                    <div className="mb-6 group relative w-fit min-h-[5rem]">
                                        {localCompany.includeLogo && localCompany.logoB64 ? (
                                            <>
                                                <img
                                                    src={localCompany.logoB64}
                                                    alt="Logo"
                                                    className="h-32 w-auto object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleRemoveLogo}
                                                    className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg p-4 h-24 w-48 hover:bg-muted/50 transition-colors">
                                                <Upload className="h-5 w-5" />
                                                <span className="text-xs font-medium">Ajouter un logo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 max-w-[50%]">
                                            <div className="space-y-1">
                                                <Input
                                                    value={localCompany.name}
                                                    onChange={(e) => setLocalCompany(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Nom de l'entreprise"
                                                    className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                />
                                                <div className="space-y-0.5">
                                                    <Input
                                                        value={localCompany.address}
                                                        onChange={(e) => setLocalCompany(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Adresse"
                                                        className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                    />
                                                    <div className="flex gap-1">
                                                        <Input
                                                            value={localCompany.postalCode}
                                                            onChange={(e) => setLocalCompany(prev => ({ ...prev, postalCode: e.target.value }))}
                                                            placeholder="CP"
                                                            className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent w-16"
                                                        />
                                                        <Input
                                                            value={localCompany.city}
                                                            onChange={(e) => setLocalCompany(prev => ({ ...prev, city: e.target.value }))}
                                                            placeholder="Ville"
                                                            className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent flex-1"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={localCompany.country}
                                                        onChange={(e) => setLocalCompany(prev => ({ ...prev, country: e.target.value }))}
                                                        placeholder="Pays"
                                                        className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                    />
                                                    <div className="flex gap-2 items-center">
                                                        <Input
                                                            value={localCompany.email}
                                                            onChange={(e) => setLocalCompany(prev => ({ ...prev, email: e.target.value }))}
                                                            placeholder="Email"
                                                            className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                        />
                                                        <span className="text-muted-foreground/50">|</span>
                                                        <Input
                                                            value={localCompany.phone}
                                                            onChange={(e) => setLocalCompany(prev => ({ ...prev, phone: e.target.value }))}
                                                            placeholder="Téléphone"
                                                            className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 items-center pt-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-muted-foreground w-12">SIRET:</span>
                                                            <Input
                                                                value={localCompany.legalId}
                                                                onChange={(e) => setLocalCompany(prev => ({ ...prev, legalId: e.target.value }))}
                                                                placeholder="Numéro SIRET"
                                                                className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-muted-foreground w-12">TVA:</span>
                                                            <Input
                                                                value={localCompany.VAT}
                                                                onChange={(e) => setLocalCompany(prev => ({ ...prev, VAT: e.target.value }))}
                                                                placeholder="Numéro TVA"
                                                                className="text-sm border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 max-w-[45%] text-left">
                                            <div className="border border-dashed border-primary/30 bg-primary/5 p-4 rounded-lg group hover:border-primary/50 transition-colors">
                                                <div className="mb-2">
                                                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                                                        <PopoverTrigger asChild>
                                                            <div className="relative">
                                                                <Input
                                                                    value={localClient.name}
                                                                    onChange={(e) => setLocalClient(prev => ({ ...prev, name: e.target.value }))}
                                                                    placeholder="Nom du client"
                                                                    className="text-lg font-style-italic text-primary placeholder:text-primary/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent cursor-pointer font-medium"
                                                                />
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Rechercher un client..." onValueChange={setSearchTerm} />
                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        <div className="p-2 text-center text-sm">
                                                                            Aucun client trouvé.
                                                                            <Button
                                                                                variant="link"
                                                                                onClick={() => {
                                                                                    setOpenClientSearch(false)
                                                                                    setClientDialogOpen(true)
                                                                                }}
                                                                                className="h-auto p-0 ml-1"
                                                                            >
                                                                                Créer nouveau
                                                                            </Button>
                                                                        </div>
                                                                    </CommandEmpty>
                                                                    <CommandGroup>
                                                                        {clients?.map((client) => (
                                                                            <CommandItem
                                                                                key={client.id}
                                                                                onSelect={() => handleClientSelect(client)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                {client.name || client.contactFirstname + " " + client.contactLastname}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-0.5">
                                                    <Input
                                                        value={localClient.address}
                                                        onChange={(e) => setLocalClient(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Adresse postale"
                                                        className="text-sm italic text-muted-foreground placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                                    />
                                                    <Input
                                                        value={localClient.complement}
                                                        onChange={(e) => setLocalClient(prev => ({ ...prev, complement: e.target.value }))}
                                                        placeholder="Complément d'adresse"
                                                        className="text-sm italic text-muted-foreground placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                                    />
                                                    <div className="flex gap-1">
                                                        <Input
                                                            value={localClient.postalCode}
                                                            onChange={(e) => setLocalClient(prev => ({ ...prev, postalCode: e.target.value }))}
                                                            placeholder="Code postal"
                                                            className="text-sm italic text-muted-foreground placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent w-20"
                                                        />
                                                        <Input
                                                            value={localClient.city}
                                                            onChange={(e) => setLocalClient(prev => ({ ...prev, city: e.target.value }))}
                                                            placeholder="Ville"
                                                            className="text-sm italic text-muted-foreground placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={localClient.country}
                                                        onChange={(e) => setLocalClient(prev => ({ ...prev, country: e.target.value }))}
                                                        placeholder="Pays"
                                                        className="text-sm italic text-muted-foreground placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                                    />
                                                    {clientOptions.deliveryAddress && (
                                                        <div className="mt-2 pt-2 border-t border-primary/20">
                                                            <Input
                                                                value={localClient.complement}
                                                                onChange={(e) => setLocalClient(prev => ({ ...prev, complement: e.target.value }))}
                                                                placeholder="Adresse de livraison"
                                                                className="text-xs italic text-muted-foreground/70 placeholder:text-muted-foreground/50 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                                            />
                                                        </div>
                                                    )}
                                                    {clientOptions.siret && selectedClient?.legalId && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            SIRET: {selectedClient.legalId}
                                                        </div>
                                                    )}
                                                    {clientOptions.vat && selectedClient?.VAT && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            TVA: {selectedClient.VAT}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nouvelle ligne de métadonnées (Devis, Date, Validité) */}
                                <div className="flex items-end justify-between mb-8">
                                    <div className="flex-1">
                                        <span className="text-xl font-medium text-foreground">
                                            Devis {quote?.rawNumber || quote?.number ? `N° ${quote.rawNumber || quote.number}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block uppercase font-medium">Date d'émission</label>
                                            <div className="min-w-[140px]">
                                                <DatePicker
                                                    value={quoteData.createdAt}
                                                    onChange={(date) => setQuoteData(prev => ({ ...prev, createdAt: date || new Date() }))}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="border border-dashed border-primary/30 rounded-md px-3 py-1.5 min-w-[200px] cursor-pointer hover:bg-primary/5 transition-colors h-[38px] flex items-center">
                                                        <span className="text-sm text-foreground">
                                                            Période de validité : {quoteData.validUntil ?
                                                                Math.ceil((new Date(quoteData.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + " jours"
                                                                : "---"}
                                                        </span>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-1" align="end">
                                                    <div className="grid gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            className="justify-start font-normal"
                                                            onClick={() => {
                                                                const date = new Date()
                                                                date.setDate(date.getDate() + 30)
                                                                setQuoteData(prev => ({ ...prev, validUntil: date }))
                                                            }}
                                                        >
                                                            30 jours
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="justify-start font-normal"
                                                            onClick={() => {
                                                                const date = new Date()
                                                                date.setDate(date.getDate() + 60)
                                                                setQuoteData(prev => ({ ...prev, validUntil: date }))
                                                            }}
                                                        >
                                                            60 jours
                                                        </Button>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" className="justify-start font-normal w-full">
                                                                    Personnalisé
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="p-0" side="left">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={quoteData.validUntil || undefined}
                                                                    onSelect={(date) => setQuoteData(prev => ({ ...prev, validUntil: date || null }))}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>

                                {/* Titre optionnel */}
                                {complementaryOptions.title && (
                                    <div className="mb-4">
                                        <Input
                                            value={quoteData.title}
                                            onChange={(e) => setQuoteData(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder={t("quotes.upsert.form.title.placeholder")}
                                            className="text-lg font-semibold border-0 border-b border-border focus:border-primary rounded-none px-0"
                                        />
                                    </div>
                                )}

                                {/* Tableau des lignes */}
                                <QuoteItemsTable
                                    items={quoteData.items}
                                    billingType={billingType}
                                    vatExemptionReason={quoteData.vatExemptionReason}
                                    currency={quoteData.currency}
                                    primaryColor={quoteSettings?.primaryColor || "#6366f1"}
                                    secondaryColor={quoteSettings?.secondaryColor || "#e0e7ff"}
                                    tableTextColor={quoteSettings?.tableTextColor || "#ffffff"}
                                    onUpdateItem={updateItem}
                                    onRemoveItem={removeItem}
                                    onAddItem={addItem}
                                />

                                {/* Totaux */}
                                <div className="border-t-2 border-border pt-4 mb-6">
                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{t("quotes.view.fields.totalHT")}:</span>
                                                <span className="font-medium">{quoteData.currency} {totals.totalHT}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{t("quotes.view.fields.totalVAT")}:</span>
                                                <span className="font-medium">{quoteData.currency} {totals.totalVAT}</span>
                                            </div>
                                            {complementaryOptions.globalDiscount && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span className="font-semibold">Remise globale:</span>
                                                    <span className="font-medium">- {quoteData.currency} 0.00</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                                <span>{t("quotes.view.fields.totalTTC")}:</span>
                                                <span>{quoteData.currency} {totals.totalTTC}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature & Acceptance (Dynamic via Sidebar) */}
                                {(complementaryOptions.signature || complementaryOptions.acceptance) && (
                                    <div className="flex justify-between mt-12 px-4 pb-4">
                                        {complementaryOptions.acceptance && (
                                            <div className="text-sm text-muted-foreground italic">
                                                "Bon pour accord"
                                            </div>
                                        )}
                                        {complementaryOptions.signature && (
                                            <div className="border border-border rounded-lg p-4 w-64 h-32 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                                                Zone de signature
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bottom Section - Tout en bas de la feuille avec espacement */}
                                <div className="mt-auto pt-12 space-y-6" style={{ marginTop: 'auto', paddingTop: '60px', paddingBottom: '40px' }}>
                                    {/* Footer / Custom Text - Atou Services 21 */}
                                    {complementaryOptions.freeField && (
                                        <div className="relative group">
                                            <div className="absolute -top-6 right-0 text-xs text-muted-foreground">
                                                {480 - (quoteData.footerText?.length || 0)} caractères restants
                                            </div>
                                            <Input
                                                value={quoteData.footerText}
                                                onChange={(e) => setQuoteData(prev => ({ ...prev, footerText: e.target.value }))}
                                                className="w-full text-center border-dashed border-primary/30 text-foreground bg-transparent focus:border-primary focus:ring-0 placeholder:text-muted-foreground text-sm py-2"
                                                placeholder="Pied de page (ex: Atou Services 21)"
                                            />
                                        </div>
                                    )}

                                    {/* TVA Section - Tout en bas */}
                                    <div className="space-y-4">
                                        <div className="max-w-md">
                                            <Select
                                                value={quoteData.vatExemptionReason}
                                                onValueChange={(val) => {
                                                    let text = quoteData.vatExemptionText;
                                                    if (val === "not_subject") text = "TVA non applicable, art. 293 B du CGI";
                                                    else if (val === "france_no_vat") text = "Exonération de TVA, article 262 ter-I du CGI";
                                                    else if (val === "eu_no_vat") text = "Exonération de TVA, article 262 ter-I du CGI (Livraison intracommunautaire)";
                                                    else if (val === "none") text = "";

                                                    setQuoteData(prev => ({
                                                        ...prev,
                                                        vatExemptionReason: val,
                                                        vatExemptionText: text
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="w-full border-border bg-muted/50 text-foreground font-medium h-10">
                                                    <SelectValue placeholder="Motif d'exonération de TVA" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Aucun motif</SelectItem>
                                                    <SelectItem value="not_subject">Je ne suis pas soumis à la TVA</SelectItem>
                                                    <SelectItem value="france_no_vat">Prestation France sans TVA</SelectItem>
                                                    <SelectItem value="eu_no_vat">Prestation hors France</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="relative group">
                                            {quoteData.vatExemptionReason !== "none" && (
                                                <Input
                                                    value={quoteData.vatExemptionText}
                                                    onChange={(e) => setQuoteData(prev => ({ ...prev, vatExemptionText: e.target.value }))}
                                                    className="w-full border-dashed border-primary/30 bg-transparent text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 px-3 py-2 h-auto text-sm transition-all"
                                                    placeholder="Mention légale de TVA..."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions (Footer of Left Column) */}
                        {!isFullscreen && (
                            <div className="flex justify-end gap-4 mt-8 no-print pb-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/quotes")}
                                >
                                    {t("common.actions.cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleExport}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {t("common.actions.export")}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {t("common.actions.save")}
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* Sidebar Options (Droite) */}
                    {!isFullscreen && (
                        <div className="w-[250px] min-w-[250px] shrink-0">
                            <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                                    <div className="flex items-center gap-2 text-foreground font-bold">
                                        <Settings className="h-5 w-5" />
                                        <span>Options</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Type de facturation */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <FileText className="h-4 w-4" />
                                        Type de facturation
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="billingType"
                                                checked={billingType === "RAPIDE"}
                                                onChange={() => setBillingType("RAPIDE")}
                                                className="w-4 h-4 text-primary border-border focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Rapide</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="billingType"
                                                checked={billingType === "COMPLET"}
                                                onChange={() => setBillingType("COMPLET")}
                                                className="w-4 h-4 text-primary border-border focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground font-medium">Complet</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="billingType"
                                                checked={billingType === "ELECTRONIC"}
                                                onChange={() => setBillingType("ELECTRONIC")}
                                                className="w-4 h-4 text-primary border-border focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Format électronique</span>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </label>
                                    </div>
                                </div>

                                {/* Client Checkboxes */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <User className="h-4 w-4" />
                                        Client
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={clientOptions.deliveryAddress}
                                                onChange={(e) => setClientOptions({ ...clientOptions, deliveryAddress: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Adresse de livraison</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={clientOptions.siret}
                                                onChange={(e) => setClientOptions({ ...clientOptions, siret: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">SIREN ou SIRET</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={clientOptions.vat}
                                                onChange={(e) => setClientOptions({ ...clientOptions, vat: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">N° de TVA intracommunautaire</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Langue */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <Languages className="h-4 w-4" />
                                        Langue
                                    </div>
                                    <div className="pl-2">
                                        <Select value={language} onValueChange={handleLanguageChange}>
                                            <SelectTrigger className="w-full bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fr">Français</SelectItem>
                                                <SelectItem value="en">Anglais</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Info complémentaires */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <AlignLeft className="h-4 w-4" />
                                        Info complémentaires
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={complementaryOptions.acceptance}
                                                onChange={(e) => setComplementaryOptions({ ...complementaryOptions, acceptance: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Conditions d'acceptation</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={complementaryOptions.signature}
                                                onChange={(e) => setComplementaryOptions({ ...complementaryOptions, signature: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Champ signature</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={complementaryOptions.title}
                                                onChange={(e) => setComplementaryOptions({ ...complementaryOptions, title: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Intitulé du document</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={complementaryOptions.freeField}
                                                onChange={(e) => setComplementaryOptions({ ...complementaryOptions, freeField: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Champ libre</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={complementaryOptions.globalDiscount}
                                                onChange={(e) => setComplementaryOptions({ ...complementaryOptions, globalDiscount: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground">Remise globale</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                </main>
            </div>

            <ClientUpsert
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
                onCreate={(newClient) => {
                    handleClientSelect(newClient)
                }}
            />
        </>
    )
}

