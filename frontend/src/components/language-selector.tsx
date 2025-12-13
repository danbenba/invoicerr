import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const SUPPORTED_LANGUAGES = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "es", name: "Español" },
    { code: "de", name: "Deutsch" },
]

export function LanguageSelector() {
    const { i18n, t } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.language || "en")

    useEffect(() => {
        // Load language from localStorage on mount
        const savedLang = localStorage.getItem("i18nextLng") || i18n.language || "en"
        if (savedLang !== i18n.language) {
            i18n.changeLanguage(savedLang)
            setCurrentLang(savedLang)
        }
    }, [i18n])

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang)
        setCurrentLang(lang)
        // Save to localStorage
        localStorage.setItem("i18nextLng", lang)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-xl">
                    <Languages className="size-4" />
                    <span className="sr-only">{t("sidebar.language.changeLanguage") || "Change language"}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem 
                        key={lang.code} 
                        onClick={() => handleLanguageChange(lang.code)}
                        className={currentLang === lang.code ? "bg-accent" : ""}
                    >
                        {lang.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

