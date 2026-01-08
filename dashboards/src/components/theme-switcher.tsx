"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="size-9">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    const cycleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={cycleTheme}
            className="size-9 transition-all duration-200"
            title={`Current: ${theme}. Click to switch.`}
        >
            {theme === "light" && <Sun className="h-4 w-4 text-amber-500" />}
            {theme === "dark" && <Moon className="h-4 w-4 text-blue-400" />}
            {theme === "system" && <Monitor className="h-4 w-4 text-muted-foreground" />}
        </Button>
    );
}
