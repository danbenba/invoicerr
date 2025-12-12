"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { useGet, usePost, usePatch } from "@/hooks/use-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, X, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { Company, Client, PaymentMethod } from "@/types"
import { PaymentMethodType } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { languageToLocale } from "@/lib/i18n"
import CurrencySelect from "@/components/currency-select"
import { ClientUpsert } from "../../clients/_components/client-upsert"

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
    const [searchTerm, setSearchTerm] = useState("")
    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${searchTerm}`)
    const { data: paymentMethods } = useGet<PaymentMethod[]>(`/api/payment-methods`)

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

    const [quoteData, setQuoteData] = useState({
        title: "",
        clientId: "",
        currency: "EUR",
        validUntil: null as Date | null,
        notes: "",
        paymentMethodId: "",
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
        if (isEdit && quote) {
            setQuoteData({
                title: quote.title || "",
                clientId: quote.clientId || "",
                currency: quote.currency || "EUR",
                validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
                notes: quote.notes || "",
                paymentMethodId: quote.paymentMethodId || "",
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

    // Ajouter une ligne
    const addItem = () => {
        setQuoteData(prev => ({
            ...prev,
            items: [...prev.items, {
                description: "",
                type: "SERVICE",
                quantity: 1,
                unitPrice: 0,
                vatRate: 0,
                order: prev.items.length,
            }],
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
            validUntil: quoteData.validUntil,
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

    return (
        <>
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-4">
                    {/* En-tête simple */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/quotes")}
                                className="h-8 w-8"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-xl font-bold text-foreground">
                                {t(`quotes.upsert.title.${isEdit ? "edit" : "create"}`)}
                            </h1>
                        </div>
                    </div>

                    {/* Document PDF en mode édition */}
                    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg p-8 mb-4" style={{ minHeight: "800px" }}>
                        {/* En-tête du document */}
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex-1 max-w-[50%]">
                                <div className="mb-6 group relative w-fit">
                                    {localCompany.includeLogo && localCompany.logoB64 ? (
                                        <>
                                            <img
                                                src={localCompany.logoB64}
                                                alt="Logo"
                                                className="h-20 w-auto object-contain"
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
                                <div className="border border-dashed border-blue-200 bg-blue-50/50 p-4 rounded-lg group hover:border-blue-300 transition-colors">
                                    <div className="mb-2">
                                        <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                                            <PopoverTrigger asChild>
                                                <div className="relative">
                                                    <Input
                                                        value={localClient.name}
                                                        onChange={(e) => setLocalClient(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Nom du client"
                                                        className="text-lg font-style-italic text-red-500 placeholder:text-red-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent cursor-pointer font-medium"
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
                                            className="text-sm italic text-blue-400 placeholder:text-blue-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                        />
                                        <Input
                                            value={localClient.complement}
                                            onChange={(e) => setLocalClient(prev => ({ ...prev, complement: e.target.value }))}
                                            placeholder="Complément d'adresse"
                                            className="text-sm italic text-blue-400 placeholder:text-blue-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                        />
                                        <div className="flex gap-1">
                                            <Input
                                                value={localClient.postalCode}
                                                onChange={(e) => setLocalClient(prev => ({ ...prev, postalCode: e.target.value }))}
                                                placeholder="Code postal"
                                                className="text-sm italic text-blue-400 placeholder:text-blue-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent w-20"
                                            />
                                            <Input
                                                value={localClient.city}
                                                onChange={(e) => setLocalClient(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="Ville"
                                                className="text-sm italic text-blue-400 placeholder:text-blue-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
                                            />
                                        </div>
                                        <Input
                                            value={localClient.country}
                                            onChange={(e) => setLocalClient(prev => ({ ...prev, country: e.target.value }))}
                                            placeholder="Pays"
                                            className="text-sm italic text-blue-400 placeholder:text-blue-300 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barre d'informations du devis */}
                        <div className="flex items-center gap-8 mb-8 border-y border-border py-4 bg-muted/20 px-4 -mx-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{pdfConfig?.labels?.quote || "Devis"} n°</span>
                                <span className="font-bold">#{quote?.number || "---"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{pdfConfig?.labels?.date || "Date"}:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{t("quotes.upsert.form.validUntil.label")}:</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-32 pl-2 text-left font-normal border-dashed"
                                        >
                                            {quoteData.validUntil ? (
                                                format(quoteData.validUntil, "P", {
                                                    locale: languageToLocale(i18n.language)
                                                })
                                            ) : (
                                                <span className="text-muted-foreground text-xs">{t("quotes.upsert.form.validUntil.placeholder")}</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={quoteData.validUntil || undefined}
                                            onSelect={(date) => setQuoteData(prev => ({ ...prev, validUntil: date || null }))}
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm font-medium text-muted-foreground">{t("quotes.upsert.form.currency.label")}:</span>
                                <CurrencySelect
                                    value={quoteData.currency}
                                    onChange={(value) => setQuoteData(prev => ({ ...prev, currency: (Array.isArray(value) ? value[0] : value) || "EUR" }))}
                                />
                            </div>
                        </div>

                        {/* Titre optionnel */}
                        <div className="mb-6">
                            <Input
                                value={quoteData.title}
                                onChange={(e) => setQuoteData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder={t("quotes.upsert.form.title.placeholder")}
                                className="text-lg font-semibold border-0 border-b-2 border-border focus:border-primary rounded-none px-0"
                            />
                        </div>

                        {/* Tableau des lignes */}
                        <div className="mb-6">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-border">
                                        <th className="text-left py-2 px-2 text-sm font-semibold text-muted-foreground">Description</th>
                                        <th className="text-left py-2 px-2 text-sm font-semibold text-muted-foreground w-24">Type</th>
                                        <th className="text-right py-2 px-2 text-sm font-semibold text-muted-foreground w-20">Qté</th>
                                        <th className="text-right py-2 px-2 text-sm font-semibold text-muted-foreground w-28">Prix unit.</th>
                                        <th className="text-right py-2 px-2 text-sm font-semibold text-muted-foreground w-20">TVA</th>
                                        <th className="text-right py-2 px-2 text-sm font-semibold text-muted-foreground w-28">Total</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quoteData.items.map((item, index) => (
                                        <tr key={index} className="border-b border-border">
                                            <td className="py-2 px-2">
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                                    placeholder="Description"
                                                    className="border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-8 text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Select
                                                    value={item.type}
                                                    onValueChange={(val) => updateItem(index, "type", val)}
                                                >
                                                    <SelectTrigger className="h-8 border-0 border-b-2 border-border focus:border-primary rounded-none px-0 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HOUR">{t("invoices.upsert.form.items.type.hour")}</SelectItem>
                                                        <SelectItem value="DAY">{t("invoices.upsert.form.items.type.day")}</SelectItem>
                                                        <SelectItem value="DEPOSIT">{t("invoices.upsert.form.items.type.deposit")}</SelectItem>
                                                        <SelectItem value="SERVICE">{t("invoices.upsert.form.items.type.service")}</SelectItem>
                                                        <SelectItem value="PRODUCT">{t("invoices.upsert.form.items.type.product")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    value={item.quantity || ""}
                                                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 0)}
                                                    className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-8 text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unitPrice || ""}
                                                    onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value) || 0)}
                                                    className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-8 text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.vatRate || ""}
                                                    onChange={(e) => updateItem(index, "vatRate", Number(e.target.value) || 0)}
                                                    className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-8 text-sm w-16"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-right text-sm font-medium">
                                                {quoteData.currency} {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(index)}
                                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                                className="mt-2 border-dashed text-sm"
                            >
                                + {t("quotes.upsert.form.items.addItem")}
                            </Button>
                        </div>

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
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                        <span>{t("quotes.view.fields.totalTTC")}:</span>
                                        <span>{quoteData.currency} {totals.totalTTC}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes et méthode de paiement */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">
                                    {pdfConfig?.labels?.notes || "Notes"}
                                </label>
                                <Textarea
                                    value={quoteData.notes}
                                    onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder={t("quotes.upsert.form.notes.placeholder")}
                                    className="min-h-[80px] border-border focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">
                                    {t("quotes.upsert.form.paymentMethod.label")}
                                </label>
                                <Select
                                    value={quoteData.paymentMethodId}
                                    onValueChange={(val) => setQuoteData(prev => ({ ...prev, paymentMethodId: val || "" }))}
                                >
                                    <SelectTrigger className="border-border focus:border-primary">
                                        <SelectValue placeholder={t("quotes.upsert.form.paymentMethod.placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods?.map((pm: PaymentMethod) => (
                                            <SelectItem key={pm.id} value={pm.id}>
                                                {pm.name} - {pm.type == PaymentMethodType.BANK_TRANSFER ? t("paymentMethods.fields.type.bank_transfer") : pm.type == PaymentMethodType.PAYPAL ? t("paymentMethods.fields.type.paypal") : pm.type == PaymentMethodType.CHECK ? t("paymentMethods.fields.type.check") : pm.type == PaymentMethodType.CASH ? t("paymentMethods.fields.type.cash") : pm.type == PaymentMethodType.OTHER ? t("paymentMethods.fields.type.other") : pm.type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Boutons en bas */}
                    <div className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/quotes")}
                        >
                            <X className="h-4 w-4 mr-2" />
                            {t("quotes.upsert.actions.cancel")}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exporter PDF
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {t(`quotes.upsert.actions.${isEdit ? "save" : "create"}`)}
                            </Button>
                        </div>
                    </div>
                </div>
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

