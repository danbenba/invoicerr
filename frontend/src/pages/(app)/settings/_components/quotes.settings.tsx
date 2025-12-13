"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useGet, usePost } from "@/hooks/use-fetch"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { DatePicker } from "@/components/date-picker"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuoteSettings {
    defaultDate?: Date
    defaultFooterText?: string
    defaultBillingType?: "RAPIDE" | "COMPLET" | "ELECTRONIC"
    defaultClientOptions?: {
        deliveryAddress: boolean
        siret: boolean
        vat: boolean
    }
    defaultComplementaryOptions?: {
        acceptance: boolean
        signature: boolean
        title: boolean
        freeField: boolean
        globalDiscount: boolean
    }
    primaryColor?: string
    secondaryColor?: string
    tableTextColor?: string
    elementPlacement?: {
        logoPosition?: "left" | "center" | "right"
        clientInfoPosition?: "left" | "right"
        totalsPosition?: "left" | "right"
    }
}

export default function QuotesSettings() {

    const quoteSettingsSchema = z.object({
        defaultDate: z.date().optional(),
        defaultFooterText: z.string().max(500, "Le texte ne peut pas dépasser 500 caractères").optional(),
        defaultBillingType: z.enum(["RAPIDE", "COMPLET", "ELECTRONIC"]).optional(),
        defaultClientOptions: z.object({
            deliveryAddress: z.boolean().optional(),
            siret: z.boolean().optional(),
            vat: z.boolean().optional(),
        }).optional(),
        defaultComplementaryOptions: z.object({
            acceptance: z.boolean().optional(),
            signature: z.boolean().optional(),
            title: z.boolean().optional(),
            freeField: z.boolean().optional(),
            globalDiscount: z.boolean().optional(),
        }).optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide (ex: #FF5733)").optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide (ex: #FF5733)").optional(),
        tableTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide (ex: #FF5733)").optional(),
        elementPlacement: z.object({
            logoPosition: z.enum(["left", "center", "right"]).optional(),
            clientInfoPosition: z.enum(["left", "right"]).optional(),
            totalsPosition: z.enum(["left", "right"]).optional(),
        }).optional(),
    })

    const { data } = useGet<QuoteSettings>("/api/company/quote-settings")
    const { trigger } = usePost<QuoteSettings>("/api/company/quote-settings")
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof quoteSettingsSchema>>({
        resolver: zodResolver(quoteSettingsSchema),
        defaultValues: {
            defaultDate: new Date(),
            defaultFooterText: "Atou Services 21",
            defaultBillingType: "COMPLET",
            defaultClientOptions: {
                deliveryAddress: true,
                siret: true,
                vat: true,
            },
            defaultComplementaryOptions: {
                acceptance: true,
                signature: true,
                title: true,
                freeField: true,
                globalDiscount: false,
            },
            primaryColor: "#6366f1",
            secondaryColor: "#e0e7ff",
            tableTextColor: "#ffffff",
            elementPlacement: {
                logoPosition: "left",
                clientInfoPosition: "right",
                totalsPosition: "right",
            },
        },
    })

    useEffect(() => {
        if (data) {
            form.reset({
                defaultDate: data.defaultDate ? new Date(data.defaultDate) : new Date(),
                defaultFooterText: data.defaultFooterText || "Atou Services 21",
                defaultBillingType: data.defaultBillingType || "COMPLET",
                defaultClientOptions: data.defaultClientOptions || {
                    deliveryAddress: true,
                    siret: true,
                    vat: true,
                },
                defaultComplementaryOptions: data.defaultComplementaryOptions || {
                    acceptance: true,
                    signature: true,
                    title: true,
                    freeField: true,
                    globalDiscount: false,
                },
                primaryColor: data.primaryColor || "#6366f1",
                secondaryColor: data.secondaryColor || "#e0e7ff",
                tableTextColor: data.tableTextColor || "#ffffff",
                elementPlacement: data.elementPlacement || {
                    logoPosition: "left",
                    clientInfoPosition: "right",
                    totalsPosition: "right",
                },
            })
        }
    }, [data, form])

    async function onSubmit(values: z.infer<typeof quoteSettingsSchema>) {
        setIsLoading(true)
        trigger(values)
            .then(() => {
                toast.success("Paramètres des devis sauvegardés avec succès")
            })
            .catch((error) => {
                console.error("Error updating quote settings:", error)
                toast.error("Erreur lors de la sauvegarde des paramètres")
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    const watchedValues = form.watch()

    return (
        <div className="flex gap-6">
            <div className="flex-1">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold">Paramètres des devis</h1>
                    <p className="text-muted-foreground">Configurez les paramètres par défaut pour vos devis</p>
                </div>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Date par défaut */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Date par défaut</CardTitle>
                            <CardDescription>Définissez la date par défaut pour les nouveaux devis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="defaultDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date d'émission par défaut</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                className="w-full"
                                                value={field.value || null}
                                                onChange={field.onChange}
                                                placeholder="Sélectionnez une date"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Cette date sera utilisée par défaut lors de la création d'un nouveau devis
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Texte par défaut du champ libre */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Texte par défaut</CardTitle>
                            <CardDescription>Configurez le texte par défaut du champ libre (pied de page)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="defaultFooterText"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Texte du champ libre par défaut</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Atou Services 21"
                                                {...field}
                                                maxLength={500}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Ce texte apparaîtra par défaut dans le champ libre (pied de page) des nouveaux devis
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Options par défaut */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Options par défaut</CardTitle>
                            <CardDescription>Définissez les options par défaut pour les nouveaux devis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-base font-semibold mb-4 block">Type de facturation par défaut</Label>
                                <FormField
                                    control={form.control}
                                    name="defaultBillingType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez un type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="RAPIDE">Rapide</SelectItem>
                                                        <SelectItem value="COMPLET">Complet</SelectItem>
                                                        <SelectItem value="ELECTRONIC">Format électronique</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="text-base font-semibold mb-4 block">Options client par défaut</Label>
                                <div className="space-y-3 pl-2">
                                    <FormField
                                        control={form.control}
                                        name="defaultClientOptions.deliveryAddress"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Adresse de livraison</FormLabel>
                                                    <FormDescription>
                                                        Afficher l'adresse de livraison par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultClientOptions.siret"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>SIREN ou SIRET</FormLabel>
                                                    <FormDescription>
                                                        Afficher le SIREN/SIRET par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultClientOptions.vat"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>N° de TVA intracommunautaire</FormLabel>
                                                    <FormDescription>
                                                        Afficher le numéro de TVA par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-base font-semibold mb-4 block">Options complémentaires par défaut</Label>
                                <div className="space-y-3 pl-2">
                                    <FormField
                                        control={form.control}
                                        name="defaultComplementaryOptions.acceptance"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Conditions d'acceptation</FormLabel>
                                                    <FormDescription>
                                                        Afficher les conditions d'acceptation par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultComplementaryOptions.signature"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Champ signature</FormLabel>
                                                    <FormDescription>
                                                        Afficher le champ signature par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultComplementaryOptions.title"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Intitulé du document</FormLabel>
                                                    <FormDescription>
                                                        Afficher l'intitulé du document par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultComplementaryOptions.freeField"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Champ libre</FormLabel>
                                                    <FormDescription>
                                                        Afficher le champ libre par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultComplementaryOptions.globalDiscount"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Remise globale</FormLabel>
                                                    <FormDescription>
                                                        Afficher la remise globale par défaut
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? false}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Couleurs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Couleurs</CardTitle>
                            <CardDescription>Personnalisez les couleurs de vos devis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="primaryColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Couleur principale</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={field.value || "#6366f1"}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        className="w-16 h-10"
                                                    />
                                                    <Input
                                                        placeholder="#6366f1"
                                                        value={field.value || "#6366f1"}
                                                        onChange={field.onChange}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Couleur principale utilisée pour les titres et éléments importants
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="secondaryColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Couleur secondaire</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={field.value || "#e0e7ff"}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        className="w-16 h-10"
                                                    />
                                                    <Input
                                                        placeholder="#e0e7ff"
                                                        value={field.value || "#e0e7ff"}
                                                        onChange={field.onChange}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Couleur secondaire utilisée pour les arrière-plans
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tableTextColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Couleur du texte des tableaux</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={field.value || "#ffffff"}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        className="w-16 h-10"
                                                    />
                                                    <Input
                                                        placeholder="#ffffff"
                                                        value={field.value || "#ffffff"}
                                                        onChange={field.onChange}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Couleur du texte dans les en-têtes de tableaux
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placement des éléments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Placement des éléments</CardTitle>
                            <CardDescription>Configurez le placement des éléments dans vos devis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="elementPlacement.logoPosition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Position du logo</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez une position" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="left">Gauche</SelectItem>
                                                        <SelectItem value="center">Centre</SelectItem>
                                                        <SelectItem value="right">Droite</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="elementPlacement.clientInfoPosition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Position des informations client</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez une position" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="left">Gauche</SelectItem>
                                                        <SelectItem value="right">Droite</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="elementPlacement.totalsPosition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Position des totaux</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez une position" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="left">Gauche</SelectItem>
                                                        <SelectItem value="right">Droite</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="min-w-32">
                            {isLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
                        </Button>
                    </div>
                </form>
            </Form>
            </div>

            {/* Preview fixe */}
            <div className="w-96 shrink-0 sticky top-6 h-fit">
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Aperçu en direct</CardTitle>
                        <CardDescription>Visualisez vos paramètres en temps réel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type de facturation:</span>
                                <span className="font-medium">{watchedValues.defaultBillingType || "COMPLET"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Texte par défaut:</span>
                                <span className="font-medium truncate max-w-[200px]" title={watchedValues.defaultFooterText || "Atou Services 21"}>
                                    {watchedValues.defaultFooterText || "Atou Services 21"}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-2">Options client:</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultClientOptions?.deliveryAddress ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Adresse de livraison</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultClientOptions?.siret ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>SIRET</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultClientOptions?.vat ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>TVA</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-2">Options complémentaires:</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultComplementaryOptions?.acceptance ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Acceptation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultComplementaryOptions?.signature ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Signature</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultComplementaryOptions?.title ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Titre</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${watchedValues.defaultComplementaryOptions?.freeField ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Champ libre</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-2">Couleurs:</div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1">
                                        <div 
                                            className="w-4 h-4 rounded border border-border" 
                                            style={{ backgroundColor: watchedValues.primaryColor || "#6366f1" }}
                                        />
                                        <span className="text-xs">Principal</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div 
                                            className="w-4 h-4 rounded border border-border" 
                                            style={{ backgroundColor: watchedValues.secondaryColor || "#e0e7ff" }}
                                        />
                                        <span className="text-xs">Secondaire</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

