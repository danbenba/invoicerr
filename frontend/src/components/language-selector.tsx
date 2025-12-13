import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

const SUPPORTED_LANGUAGES = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "es", name: "Español" },
    { code: "de", name: "Deutsch" },
]

export function LanguageSelector() {
    const { i18n } = useTranslation()
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

    const currentLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name || "English"

    return (
        <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select value={currentLang} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={currentLanguageName} />
                </SelectTrigger>
                <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

