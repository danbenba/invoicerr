"use client"

import type { Client, PaymentMethod, Quote } from "@/types"
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { GripVertical, Plus, Trash2, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useGet, usePatch, usePost } from "@/hooks/use-fetch"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { CSS } from "@dnd-kit/utilities"
import { ClientUpsert } from "../../clients/_components/client-upsert"
import CurrencySelect from "@/components/currency-select"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { PaymentMethodType } from "@/types"
import type React from "react"
import SearchSelect from "@/components/search-input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface QuoteUpsertPageProps {
    quoteId?: string
}

export function QuoteUpsertPage({ quoteId }: QuoteUpsertPageProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const isEdit = !!quoteId

    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const { data: quote } = useGet<Quote>(quoteId ? `/api/quotes/${quoteId}` : null)

    const quoteSchema = z.object({
        title: z.string().optional(),
        clientId: z
            .string()
            .min(1, t("quotes.upsert.form.client.errors.required"))
            .refine((val) => val !== "", {
                message: t("quotes.upsert.form.client.errors.required"),
            }),
        currency: z.string().optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
        paymentMethodId: z.string().optional(),
        items: z.array(
            z.object({
                id: z.string().optional(),
                description: z
                    .string()
                    .min(1, t("quotes.upsert.form.items.description.errors.required"))
                    .refine((val) => val !== "", {
                        message: t("quotes.upsert.form.items.description.errors.required"),
                    }),
                type: z.string(),
                quantity: z
                    .number({ invalid_type_error: t("quotes.upsert.form.items.quantity.errors.required") })
                    .min(1, t("quotes.upsert.form.items.quantity.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.upsert.form.items.quantity.errors.invalid"),
                    }),
                unitPrice: z
                    .number({
                        invalid_type_error: t("quotes.upsert.form.items.unitPrice.errors.required"),
                    })
                    .min(0, t("quotes.upsert.form.items.unitPrice.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.upsert.form.items.unitPrice.errors.invalid"),
                    }),
                vatRate: z
                    .number({ invalid_type_error: t("quotes.upsert.form.items.vatRate.errors.required") })
                    .min(0, t("quotes.upsert.form.items.vatRate.errors.min")),
                order: z.number(),
            }),
        ),
    })

    const [searchTerm, setSearchTerm] = useState("")
    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${searchTerm}`)
    const { data: paymentMethods } = useGet<PaymentMethod[]>(`/api/payment-methods`)

    const { trigger: createTrigger } = usePost("/api/quotes")
    const { trigger: updateTrigger } = usePatch(`/api/quotes/${quoteId}`)

    const form = useForm<z.infer<typeof quoteSchema>>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            title: "",
            clientId: "",
            validUntil: undefined,
            notes: "",
            items: [],
        },
    })

    useEffect(() => {
        if (isEdit && quote) {
            form.reset({
                title: quote.title || "",
                clientId: quote.clientId || "",
                validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
                currency: quote.currency,
                notes: quote.notes || "",
                paymentMethodId: (quote as any).paymentMethodId || "",
                items: quote.items
                    .sort((a, b) => a.order - b.order)
                    .map((item) => ({
                        id: item.id,
                        type: item.type,
                        description: item.description || "",
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        vatRate: item.vatRate || 0,
                        order: item.order || 0,
                    })),
            })
        } else {
            form.reset({
                title: "",
                clientId: "",
                validUntil: undefined,
                notes: "",
                items: [],
            })
        }
    }, [quote, form, isEdit])

    const { control, handleSubmit, setValue, watch } = form
    const { fields, append, move, remove } = useFieldArray({
        control,
        name: "items",
    })

    const watchedItems = watch("items")
    const currency = watch("currency") || "EUR"

    // Calculs automatiques
    const totals = useMemo(() => {
        const totalHT = watchedItems.reduce((sum, item) => {
            const qty = item.quantity || 0
            const price = item.unitPrice || 0
            return sum + (qty * price)
        }, 0)

        const totalVAT = watchedItems.reduce((sum, item) => {
            const qty = item.quantity || 0
            const price = item.unitPrice || 0
            const vat = item.vatRate || 0
            return sum + (qty * price * vat / 100)
        }, 0)

        const totalTTC = totalHT + totalVAT

        return {
            totalHT: totalHT.toFixed(2),
            totalVAT: totalVAT.toFixed(2),
            totalTTC: totalTTC.toFixed(2),
        }
    }, [watchedItems])

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

    const onDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id)
            const newIndex = fields.findIndex((f) => f.id === over.id)
            move(oldIndex, newIndex)
            const reordered = arrayMove(fields, oldIndex, newIndex)
            reordered.forEach((_, index) => {
                setValue(`items.${index}.order`, index)
            })
        }
    }

    useEffect(() => {
        fields.forEach((_, i) => {
            setValue(`items.${i}.order`, i)
        })
    }, [fields, setValue])

    const onRemove = (index: number) => {
        remove(index)
    }

    const onSubmit = (data: z.infer<typeof quoteSchema>) => {
        console.debug("Submitting quote data:", data)

        const trigger = isEdit ? updateTrigger : createTrigger

        trigger(data)
            .then(() => {
                toast.success(t(`quotes.upsert.messages.${isEdit ? "updateSuccess" : "createSuccess"}`))
                navigate("/quotes")
            })
            .catch((err) => {
                console.error(err)
                toast.error(t(`quotes.upsert.messages.${isEdit ? "updateError" : "createError"}`))
            })
    }

    const handleClientCreate = (newClient: Client) => {
        setSearchTerm("")
        form.setValue("clientId", newClient.id)
        clients?.push(newClient)
        form.trigger("clientId")
    }

    return (
        <>
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto p-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="data-cy=quote-form">
                            {/* En-tête style feuille */}
                            <div className="bg-card border-b border-border p-6 sticky top-0 z-10 mb-6 rounded-t-lg">
                                <div className="flex items-center justify-between mb-4">
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
                                        <h2 className="text-2xl font-bold text-foreground">
                                            {t(`quotes.upsert.title.${isEdit ? "edit" : "create"}`)}
                                        </h2>
                                    </div>
                                </div>

                                {/* Informations principales en ligne */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <SearchSelect
                                                        options={(clients || []).map((c) => ({ 
                                                            label: c.name || c.contactFirstname + " " + c.contactLastname, 
                                                            value: c.id 
                                                        }))}
                                                        value={field.value ?? ""}
                                                        onValueChange={(val) => field.onChange(val || null)}
                                                        onSearchChange={setSearchTerm}
                                                        placeholder={t("quotes.upsert.form.client.placeholder")}
                                                        data-cy="quote-client-select"
                                                        noResultsComponent={
                                                            <Button
                                                                type="button"
                                                                variant="link"
                                                                onClick={() => setClientDialogOpen(true)}
                                                            >
                                                                {t("quotes.upsert.form.client.noOptions")}
                                                            </Button>
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <CurrencySelect 
                                                        value={field.value} 
                                                        onChange={(value) => field.onChange(value)} 
                                                        data-cy="quote-currency-select" 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="validUntil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <DatePicker
                                                        className="w-full"
                                                        value={field.value || null}
                                                        onChange={field.onChange}
                                                        placeholder={t("quotes.upsert.form.validUntil.placeholder")}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Corps de la feuille */}
                            <div className="bg-muted/30 p-6">
                                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                                    {/* Titre optionnel */}
                                    <FormField
                                        control={control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem className="mb-4">
                                                <FormControl>
                                                    <Input 
                                                        {...field} 
                                                        placeholder={t("quotes.upsert.form.title.placeholder")}
                                                        className="text-lg font-semibold border-0 border-b-2 border-border focus:border-primary rounded-none px-0 bg-transparent"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Tableau des lignes - Style Time */}
                                    <div className="mt-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b-2 border-border">
                                                        <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground w-8"></th>
                                                        <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground min-w-[300px]">
                                                            {t("quotes.upsert.form.items.description.label")}
                                                        </th>
                                                        <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground w-32">
                                                            {t("quotes.upsert.form.items.type.label")}
                                                        </th>
                                                        <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground w-24">
                                                            {t("quotes.upsert.form.items.quantity.label")}
                                                        </th>
                                                        <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground w-32">
                                                            {t("quotes.upsert.form.items.unitPrice.label")}
                                                        </th>
                                                        <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground w-24">
                                                            {t("quotes.upsert.form.items.vatRate.label")}
                                                        </th>
                                                        <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground w-32">
                                                            Total
                                                        </th>
                                                        <th className="w-12"></th>
                                                    </tr>
                                                </thead>
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                                        <tbody>
                                                            {fields.map((fieldItem, index) => {
                                                                const item = watchedItems[index]
                                                                const itemTotal = ((item?.quantity || 0) * (item?.unitPrice || 0)).toFixed(2)
                                                                
                                                                return (
                                                                    <SortableItem
                                                                        key={fieldItem.id}
                                                                        id={fieldItem.id}
                                                                    >
                                                                        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                                                                            <td className="py-2 px-2">
                                                                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <FormField
                                                                                    control={control}
                                                                                    name={`items.${index}.description`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <FormControl>
                                                                                                <Input
                                                                                                    {...field}
                                                                                                    placeholder={t("quotes.upsert.form.items.description.placeholder")}
                                                                                                    className="border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-9 bg-transparent"
                                                                                                />
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <FormField
                                                                                    control={control}
                                                                                    name={`items.${index}.type`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <FormControl>
                                                                                                <Select value={field.value ?? 'SERVICE'} onValueChange={(val) => field.onChange(val as any)}>
                                                                                                    <SelectTrigger className="h-9 border-0 border-b-2 border-border focus:border-primary rounded-none px-0 bg-transparent">
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
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <FormField
                                                                                    control={control}
                                                                                    name={`items.${index}.quantity`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <FormControl>
                                                                                                <Input
                                                                                                    {...field}
                                                                                                    type="number"
                                                                                                    value={field.value || ""}
                                                                                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                                                                    placeholder="0"
                                                                                                    className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-9 bg-transparent"
                                                                                                />
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <FormField
                                                                                    control={control}
                                                                                    name={`items.${index}.unitPrice`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <FormControl>
                                                                                                <div className="flex items-center justify-end">
                                                                                                    <Input
                                                                                                        {...field}
                                                                                                        type="number"
                                                                                                        value={field.value || ""}
                                                                                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                                                                        placeholder="0.00"
                                                                                                        className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-9 w-full bg-transparent"
                                                                                                    />
                                                                                                    <span className="text-muted-foreground ml-1">{currency}</span>
                                                                                                </div>
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <FormField
                                                                                    control={control}
                                                                                    name={`items.${index}.vatRate`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <FormControl>
                                                                                                <div className="flex items-center justify-end">
                                                                                                    <Input
                                                                                                        {...field}
                                                                                                        type="number"
                                                                                                        step="0.01"
                                                                                                        value={field.value || ""}
                                                                                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number.parseFloat(e.target.value.replace(",", ".")))}
                                                                                                        placeholder="0"
                                                                                                        className="text-right border-0 focus:ring-0 focus:border-b-2 focus:border-primary rounded-none px-0 h-9 w-16 bg-transparent"
                                                                                                    />
                                                                                                    <span className="text-muted-foreground ml-1">%</span>
                                                                                                </div>
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2 text-right font-medium text-foreground">
                                                                                {currency} {itemTotal}
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => onRemove(index)}
                                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    dataCy={`remove-item-${index}`}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    </SortableItem>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </SortableContext>
                                                </DndContext>
                                            </table>
                                        </div>

                                        {/* Bouton ajouter ligne */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                append({
                                                    description: "",
                                                    type: "SERVICE",
                                                    quantity: 1,
                                                    unitPrice: 0,
                                                    vatRate: 0,
                                                    order: fields.length,
                                                })
                                            }
                                            className="mt-4 border-dashed"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            {t("quotes.upsert.form.items.addItem")}
                                        </Button>
                                    </div>

                                    {/* Totaux */}
                                    <div className="mt-8 border-t-2 border-border pt-4">
                                        <div className="flex justify-end">
                                            <div className="w-80 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("quotes.view.fields.totalHT")}:</span>
                                                    <span className="font-medium text-foreground">{currency} {totals.totalHT}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("quotes.view.fields.totalVAT")}:</span>
                                                    <span className="font-medium text-foreground">{currency} {totals.totalVAT}</span>
                                                </div>
                                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                                    <span className="text-foreground">{t("quotes.view.fields.totalTTC")}:</span>
                                                    <span className="text-foreground">{currency} {totals.totalTTC}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes et méthode de paiement */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea 
                                                            {...field} 
                                                            placeholder={t("quotes.upsert.form.notes.placeholder")}
                                                            className="min-h-[100px] border-border focus:border-primary bg-background"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="space-y-4">
                                            <FormField
                                                control={control}
                                                name="paymentMethodId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Select value={field.value ?? ""} onValueChange={(val) => field.onChange(val || "")}>
                                                                <SelectTrigger className="border-border focus:border-primary bg-background">
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
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer avec boutons */}
                            <div className="bg-card border-t border-border p-6 sticky bottom-0 z-10 mt-6 rounded-b-lg">
                                <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => navigate("/quotes")}>
                                        {t("quotes.upsert.actions.cancel")}
                                    </Button>
                                    <Button type="submit" dataCy="quote-submit">
                                        {t(`quotes.upsert.actions.${isEdit ? "save" : "create"}`)}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>

            <ClientUpsert
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
                onCreate={handleClientCreate}
            />
        </>
    )
}

function SortableItem({
    id,
    children,
}: {
    id: string
    children: React.ReactNode
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </tr>
    )
}

